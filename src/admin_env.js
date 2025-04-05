global.is_local = /localhost|192\.168\./.test(window.location.host) ? 1 : 0;

let local = 'http://' + window.location.hostname + ':6057';
let isAqa = /aqa\./gi.test(window.location.hostname)
// let local = 'http://212.8.247.141:6057'
local = 'https://api-razvitie.itrum.ru'

let isDemo = window.location.href.indexOf('demo.') > -1;
let isAcademy = window.location.href.indexOf('itk.academy') > -1;

let servers = {
    local: local,
    aqa: 'https://aqa-api.javacode.ru',
    demo: 'https://demo-api.itk.academy',
    academy:  'https://api-razvitie.itk.academy',
    def:  'https://api-razvitie.itrum.ru'
}
let Demo =  {
    login: <>
        <img src={'/logos/academy/logo_hor.png'} height={25} style={{opacity: .8}}/>
        {/*<div style={{marginTop: '10px'}}></div>*/}
        {/*Портал Развития*/}
    </>,
    main: <img src={'/logos/academy/logo_vert.png'} height={100} />,
}


let logoImgs = {
    def: {
        login: 'Портал развития',
        main: 'Развитие',
    },
    aqa: {
        login: 'Портал Развития',
        main: 'Развитие',
    },
    demo: Demo,
    academy: Demo,
}

let serverKey = global.is_local ? 'local' : isAcademy ? 'academy': isAqa ? 'aqa' : isDemo ? 'demo' : 'def'
if (global?.is_local) {
    serverKey = 'academy'
}
window.env = {
    domain: servers[serverKey] || servers.def,
    isDemo,
    isAcademy,
    serverKey,
    logoImg: logoImgs[serverKey] || logoImgs.def,
    RUN_CODE_DOMAIN: 'http://localhost:4988',
    VIDEO_UPLOAD_DOMAIN: 'https://uploader.itconsult-web.ru',
    VIDEO_STATIC_DOMAIN: 'https://static.itconsult-web.ru',
    VIDEO_DOMAIN: global.is_local ? 'http://localhost:1111' : 'https://uploader.itconsult-web.ru',
    title: 'Портал развития',
    login_title: 'Портал развития',
    // login_title: 'Interview Portal',
    wo_token: false,
    redirect_after_login: '/admin/users',
    woTableSelect: true,
    nameFn(name) {
        let obj = {
            pending: 'Ожидает',
            submitted: 'Подтвержден',
            started: 'Начался'
        }

        let arr = [...[
            {
                value: "edit",
                name: "Редактирую",
            },
            {
                name: "Отправлено",
                value: "sent",
            },
            {
                name: "Проверено",
                value: "approved",
            },
            {
                name: "Отменено",
                value: "canceled",
            },
        ], ...[ {name: 'Выберите из списка', value: ''}, { name: 'Ответ не понятен', value: 'unclear_question' },
            { value: 'not_deep_answer', name: 'Не глубокий ответ' }, { value: 'not_actual_question', name: 'Вопрос не актуален' }],
            ...[
            {name: "HR", value: "HR"},
            {name: "Тех", value: "tech"},
        ], ...[
            {name: "Ожидает старта", value: "waiting"},
            {name: "Офер", value: "offer"},
            {name: "След фаза", value: "next_stage"},
            {name: "Не прошли", value: "bad"},
        ]]

        arr.forEach(it => {
            obj[it.value] = it.name;
        })

        let _name = name;
        try {
            _name = (name || '').trim('').toLowerCase()
        } catch (e) {
            _name = name
        }

        return obj[_name] || name
    }
}

document.title = window.env.title;
