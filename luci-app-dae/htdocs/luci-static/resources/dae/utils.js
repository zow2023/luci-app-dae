'use strict';
'require fs';

return L.Class.extend({
    ensureAllConfigs: function () {
        var defaults = {
            '/etc/dae/config.dae': '# config.dae\n# load all dae files placed in ./config.d/\ninclude {\n    config.d/*.dae\n}\nglobal {\n    log_level:"error"\n    check_interval:"600s"\n    check_tolerance:"5ms"\n    lan_interface:"br-lan"\n    wan_interface:"auto"\n    enable_local_tcp_fast_redirect:"true"\n    auto_config_kernel_parameter:"true"\n    sniffing_timeout:"300ms"\n    no_connectivity_behavior:"direct"\n}',
            '/etc/dae/config.d/dns.dae': '# dns.dae\ndns {\n    upstream {\n        localdns:\'udp://127.0.0.1:53\'\n        overseadns:\'udp://dns.google:53\'\n    }\n    routing {\n        request {\n            qtype(https) -> reject\n            qname(geosite:gfw) -> overseadns\n            fallback:localdns\n        }\n        response {\n            upstream(localdns) && !ip(geoip:cn) -> overseadns\n            fallback:accept\n        }\n    }\n}',
            '/etc/dae/config.d/node.dae': 'node {\n    node1: \'xxx\'\n    node2: \'xxx\'\n}\nsubscription {\n    my_sub: \'https://www.example.com/subscription/link\'\n}\ngroup {\n    my_group {\n        filter: subtag(my_sub) && !name(keyword: \'ExpireAt:\')\n        filter: subtag(my_sub2)\n        policy: min_moving_avg\n    }\n    local_group {\n        filter: name(node1, node2)\n        policy: fixed(0)\n    }\n}',
            '/etc/dae/config.d/route.dae': 'routing {\n    dip(geoip:private) && dport(53) && l4proto(tcp) -> block\n    pname(dnsmasq, zerotier-one) -> must_direct\n    dip(224.0.0.0/3, \'ff00::/8\') -> direct\n    dip(geoip:private) -> direct\n\n    #domain(geosite:synology, geosite:category-bank-cn) -> direct\n    #domain(geosite:category-ai-!cn) -> ai\n    #domain(geosite:category-entertainment) -> media\n    #dip(geoip:telegram) -> must_tg\n\n    domain(geosite:gfw) -> proxy\n\n    dip(geoip:cn) -> direct\n    fallback:proxy\n}'
        };

        return fs.exec('/bin/mkdir', ['-p', '/etc/dae/config.d']).then(function () {
            var promises = [];
            for (var path in defaults) {
                (function (p, content) {
                    promises.push(
                        fs.read(p).catch(function () {
                            return fs.write(p, content);
                        })
                    );
                })(path, defaults[path]);
            }
            return Promise.all(promises);
        });
    }
});
