'use strict';
'require view';
'require form';
'require fs';
'require ui';
'require rpc';
'require dae.utils as utils';

var callServiceStatus = rpc.declare({
	object: 'luci.dae',
	method: 'get_status',
	expect: { result: 'running' }
});

return view.extend({
	load: function () {
		return utils.ensureAllConfigs().then(function () {
			return Promise.all([
				fs.read('/etc/dae/config.dae'),
				fs.exec_direct('/usr/bin/pgrep', ['-f', '/usr/bin/dae'])
			]);
		}).then(function (result) {
			var configData = result[0];
			var pid = result[1];
			if (pid) {
				return fs.exec_direct('awk', ['/VmRSS/ {print $2/1024 " MB"}', '/proc/' + pid.trim() + '/status']).then(function (mem) {
					return [configData, pid, mem];
				}).catch(function () {
					return [configData, pid, null];
				});
			}
			return [configData, null, null];
		});
	},

	render: function (data) {
		var configData = data[0] || '';
		var running = !!data[1];
		var memory = data[2];

		var m, s, o;

		m = new form.Map('dae', _('Global Settings'), _('Configure global settings for DAE.'));

		// Status section
		s = m.section(form.NamedSection, '__status__');
		s.render = function () {
			var statusText = running ? '<span style="color:green;font-weight:bold">' + _('Running') + '</span>' : '<span style="color:red;font-weight:bold">' + _('Not Running') + '</span>';
			var memText = memory ? ' (' + memory.trim() + ')' : '';
			
			return E('div', { class: 'cbi-section' }, [
				E('div', { class: 'cbi-value' }, [
					E('label', { class: 'cbi-value-title' }, _('Service Status')),
					E('div', { class: 'cbi-value-field' }, statusText + memText)
				])
			]);
		};

		// Settings section
		s = m.section(form.TypedSection, 'dae');
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'enabled', _('Enabled'));
		o.rmempty = false;

		o = s.option(form.Button, '_reload', _('Reload Service'), _('Reload service to apply configuration.'));
		o.inputstyle = 'reload';
		o.onclick = function () {
			return fs.exec('/etc/init.d/dae', ['hot_reload']).then(function () {
				ui.addNotification(null, E('p', _('Service reloaded successfully.')), 'info');
				window.location.reload();
			}).catch(function (e) {
				ui.addNotification(null, E('p', _('Failed to reload service: %s').format(e.message)), 'error');
			});
		};

		// Auto update settings
		o = s.option(form.Flag, 'subscribe_auto_update', _('Enable Auto Subscribe Update'));
		o.rmempty = false;

		// Update cycle
		o = s.option(form.ListValue, 'subscribe_update_week_time', _('Update Cycle'));
		o.value('*', _('Every Day'));
		o.value('1', _('Every Monday'));
		o.value('2', _('Every Tuesday'));
		o.value('3', _('Every Wednesday'));
		o.value('4', _('Every Thursday'));
		o.value('5', _('Every Friday'));
		o.value('6', _('Every Saturday'));
		o.value('7', _('Every Sunday'));
		o.default = '*';
		o.depends('subscribe_auto_update', '1');

		// Update time
		o = s.option(form.ListValue, 'subscribe_update_day_time', _('Update Time (Every Day)'));
		for (var t = 0; t <= 23; t++) {
			o.value(t, t + ':00');
		}
		o.default = '0';
		o.depends('subscribe_auto_update', '1');

		// Global configuration editor
		o = s.option(form.TextValue, 'globalconf', _('Global Configuration'), _('Correctly configure the include field for separate-config to work, or enter complete configuration here (other sub-pages won\'t need configuration and won\'t take effect).'));
		o.rows = 20;
		o.rmempty = true;
		o.monospace = true;

		o.cfgvalue = function (section_id) {
			return configData;
		};

		o.write = function (section_id, formvalue) {
			return utils.ensureAllConfigs().then(function () {
				return fs.write('/etc/dae/config.dae', formvalue.replace(/\r\n/g, '\n'));
			});
		};

		return m.render();
	}
});
