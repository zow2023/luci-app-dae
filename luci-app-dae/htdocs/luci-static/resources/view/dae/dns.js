'use strict';
'require view';
'require form';
'require fs';
'require ui';
'require dae.utils as utils';

return view.extend({
    load: function () {
        return utils.ensureAllConfigs().then(function () {
            return fs.read('/etc/dae/config.d/dns.dae');
        });
    },

    render: function (configData) {
        var m, s, o;

        m = new form.Map('dae', _('DNS Settings'), _('Configure DNS settings for DAE.'));

        s = m.section(form.TypedSection, 'dae');
        s.anonymous = true;
        s.addremove = false;

        o = s.option(form.Button, '_reload', _('Reload Service'), _('Reload service to apply configuration.'));
        o.inputstyle = 'reload';
        o.onclick = function () {
            return fs.exec('/etc/init.d/dae', ['hot_reload']).then(function () {
                ui.addNotification(null, E('p', _('Service reloaded successfully.')), 'info');
            }).catch(function (e) {
                ui.addNotification(null, E('p', _('Failed to reload service: %s').format(e.message)), 'error');
            });
        };

        o = s.option(form.TextValue, 'dnsconf', _('DNS Configuration'), _('Configure DNS settings for DAE. Click "Save" to apply changes to /etc/dae/config.d/dns.dae.'));
        o.rows = 25;
        o.rmempty = true;
        o.monospace = true;

        o.cfgvalue = function (section_id) {
            return configData;
        };

        o.write = function (section_id, formvalue) {
            return utils.ensureAllConfigs().then(function () {
                return fs.write('/etc/dae/config.d/dns.dae', formvalue.replace(/\r\n/g, '\n'));
            });
        };

        return m.render();
    }
});
