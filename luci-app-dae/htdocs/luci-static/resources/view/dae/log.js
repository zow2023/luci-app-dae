'use strict';
'require view';
'require fs';
'require ui';
'require poll';

return view.extend({
    render: function () {
        var logTextarea = E('textarea', {
            'class': 'cbi-input-textarea',
            'style': 'width:100%; height:500px; font-family:monospace',
            'readonly': 'readonly',
            'wrap': 'off'
        });

        var pollLog = function () {
            return fs.exec_direct('tail', ['-n', '1000', '/var/log/dae/dae.log']).then(function (res) {
                logTextarea.value = res || '';
                logTextarea.scrollTop = logTextarea.scrollHeight;
            }).catch(function (e) {
                logTextarea.value = _('Failed to load log: %s').format(e.message);
            });
        };

        poll.add(pollLog, 5);

        return E('div', { class: 'cbi-map' }, [
            E('h2', _('Logs')),
            E('div', { class: 'cbi-section' }, [
                E('div', { class: 'cbi-section-descr' }, _('Displaying the last 1000 lines of the log.')),
                E('div', { class: 'cbi-value' }, [
                    logTextarea
                ]),
                E('div', { class: 'cbi-page-actions' }, [
                    E('button', {
                        'class': 'cbi-button cbi-button-apply',
                        'click': function () {
                            return fs.exec_direct('truncate', ['-s', '0', '/var/log/dae/dae.log']).then(function () {
                                ui.addNotification(null, E('p', _('Log cleared successfully.')), 'info');
                                pollLog();
                            });
                        }
                    }, _('Clear Log')),
                    E('button', {
                        'class': 'cbi-button cbi-button-neutral',
                        'click': pollLog
                    }, _('Refresh'))
                ])
            ])
        ]);
    },

    handleSave: null,
    handleSaveApply: null,
    handleReset: null
});
