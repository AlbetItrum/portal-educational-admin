import reportWebVitals from "./reportWebVitals";
import {createRoot} from "react-dom/client";
import React, {lazy, useEffect, useState, Suspense} from "react";
import _ from "underscore";
import env from "./admin_env";
import Skeleton from "./libs/Skeleton";
import Login from "./libs/Login/Login";
import DefOne from "./libs/DefOne";
import DefList from "./libs/DefList";
import Fetcher from "./comps/methods/Fetcher";
import EventLoop from "./comps/EventLoop";
import CodeRun from "./comps/Suggest/CodeRun";
import RunExam from "./comps/RunExam";
import Meter from "./comps/Suggest/MeterFn";
import AudioShort, {mediaInit, recognitionInit} from "./comps/TrainMethods/AudioShort/AudioShort"

import {
    createBrowserRouter,
    RouterProvider,
    redirect,
    useLocation,
    useNavigate,
    useLoaderData,
    useParams,
    // useHistory,
    useActionData,
    Link,
    Outlet,
} from "react-router-dom";
import Storage from "./comps/Storage";
import DynamicStyle from "./comps/Suggest/DynamicStyle";
import Player from "./comps/TrainMethods/AudioShort/Player";
import Train from "./comps/TrainMethods/Train";
import DisableScreenWhenTrain from "./comps/TrainMethods/DisableScreenWhenTrain";
import TrainPage from "./comps/TrainMethods/TrainPage";

let err = console.error;
console.error = (...args) => {
    if (/Warning: Cannot update a component/gi.test(args[0])) {
        return;
    }
    err(...args)
}
let timeout;

export const stopAnyPlay = (key) => {
    clearTimeout(timeout)
    console.log("qqqqq titlttl stopAnyPlay", key);

    try {
        myPlayer({src: ''})
        if (window.speechSynthesis && window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }
    } catch (e) {

    }
}
window.textToVoice = (params, cb, delay = 5) => {
    let {text, lng = 'ru-RU', textToVoiceTimeoutMS} = params || {};
    let speed = params.textToVoiceSpeedMSPerSymbolLimit || 100
    delay = textToVoiceTimeoutMS || (((text || '').length * speed) + 2000)
    stopAnyPlay('speech start');

    console.log("qqqqq delaydelaydelay", delay);
    timeout = setTimeout(() => {
        stopAnyPlay('textToVoice');
        cb && cb();
    }, delay)

    if ('speechSynthesis' in window) {

        const synth = window.speechSynthesis;

        text = (text || '').replace(/\`\`\`([\s\S]*?)\`\`\`/gi, '')
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0; // Speech rate (1.0 is the default)
        utterance.pitch = 1.0; // Speech pitch (1.0 is the default)
        utterance.lang = lng;
        utterance.onend = () => {
            clearTimeout(timeout)
            setTimeout(() => {
                console.log("qqqqq titlttl CALLBACK");
                cb && cb();
            }, 0)
        }
        synth.speak(utterance);
    } else {
        alert("Your browser does not support the Web Speech API. Please use a modern browser.");
    }
}

let files = require.context("./comps", true, /\.(js|jsx)$/).keys();
global.Fetcher = Fetcher;

global.question_statuses = [
    {name: "Новый", status: "", desc: "1-2 дня"},
    {name: "Плохо", status: "bad", desc: "1-2 дня"},
    {name: "Норм", status: "norm", desc: "3-4 дня"},
    {name: "Хорошо", status: "good", desc: "8-10 дней"},
    {name: "Очень хорошо", status: "very_good", desc: "30 дней"},
];

function sync_components() {
    Storage.syncCategories(() => {
        global.UpdateRootFn && global.UpdateRootFn();
    });
}

// sync_components();

function getter(opts) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve({_id: 1003, name: "124xzcv"});
        }, 5000);
    });
}

function pub_menu(arr) {
    return arr.filter(it => it).map((it) => {
        return it.name ? it : {name: it, url: "/" + it.toLowerCase(), isVisible: it.isVisible};
    });
}

function to_url_arr(obj) {
    let arr = [];
    _.each(obj, (item, ind) => {
        let url = item.admin_url || ind;

        arr.push({
            path: url,
            element: <DefList props={item}></DefList>,
        });

        arr.push({
            path: url + "/:id",
            element: <DefOne props={item}></DefOne>,
        });
    });
    return arr;
}

let isDemo = global.env.isDemo;

global.CONFIG = {
    menu: pub_menu([
        {name: "Профиль", url: "profile"},
        "HR",
        {name: "Выход", url: "/logout"},
    ]),
    header: pub_menu([
        {name: "Главная", url: "main"},
        {name: "Курсы", url: "courses"},
        isDemo ? null : {name: "Интервью", url: "interviews"},
        {name: "Экзамены", url: "quiz"},
        {name: "Предложения контента", url: "suggestions"},
        {name: "Видео", url: "video"},
        {name: "Тест микрофона", url: "mic"},
        // { name: "Таблица Вопросов", url: "table" },
        {name: "Профиль", url: "profile"},
        {
            name: "Карьерный трек", url: "temp/features-tree", isVisible: () => {
                return ((global.user.get_info() || {}).customData || {}).isCV
            }
        },
    ]),
    urls: {
        suggestions: {
            woModal: true,
            woAdd: true,
            url: "/my-suggestion",
            autoSave: 500,
            edit: [{size: 12, path: "Suggest/SuggestionItem"}],
            top_filters: [
                {
                    key: "status",
                    title: "Status",
                    def_name: "Все",
                    def_value: "",
                    arr: [
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
                    ],
                },
            ],
            tabsTitle: "Мои предложения контента",
            tabs: [
                {name: "Имя", key: "name"},
                {name: "Статус", key: "status"},
                // {name: 'Вопрос', key: 'question'},
                // {name: 'Пользователь', key: 'user'},
            ],
        },
        interviews: {
            woModal: true,
            modalSize: "small",
            autoSave: 200,
            url: "/my-interview",
            top_filters: [
                {
                    key: "type",
                    def_name: "Все",
                    def_value: "",
                    arr: [
                        {name: "HR", value: "HR"},
                        {name: "Тех", value: "tech"},
                    ],
                },
                {
                    key: "status",
                    def_name: "Все",
                    def_value: "",
                    arr: [
                        {name: "Ожидает старта", value: "waiting"},
                        {name: "Офер", value: "offer"},
                        {name: "След фаза", value: "next_stage"},
                        {name: "Не прошли", value: "bad"},
                    ],
                },
            ],
            tabsTitle: "Мои интервью",
            create: [
                {size: 12, name: "Название", key: "name"},
                {size: 12, type: "HR"},
            ],
            edit: [
                {
                    path: "Interview/Interview",
                    size: 12,
                },
            ],
            tabs: [
                {name: "Имя", key: "name"},
                {name: "Не фильтр вопросов", key: "problemQuestions"},
                {name: "Вопросов", key: "questionsSize"},
                {name: "Клинет", key: "client"},
                {name: "Тип", key: "type"},
                {name: "Статус", key: "status"},
                {name: "Дата", key: "date", type: 'date'},
            ],
        },
        quiz: {
            woModal: true,
            modalSize: "small",
            autoSave: 200,
            url: "/my-exam",
            tabsTitle: "Мои экзамены",

            top_filters: [
                {
                    key: "status",
                    def_name: "Все",
                    def_value: "",
                    arr: [
                        {name: "Ожидают", value: "waiting"},
                        {name: "Начались", value: "started"},
                        {name: "Закончились", value: "submitted"},
                    ],
                },
            ],
            woAdd: true,
            edit: [
                {
                    path: "RunExam",
                    size: 12,
                },
            ],
            tabs: [
                {name: "Название", key: "name"},
                // {name: '%', key: 'perc'},
                // {name: 'Теор Квиз %', key: 'quizPerc'},
                {name: "Старт", key: "startCd", type: "date"},
                {name: "Сабмит", key: "submitCd", type: "date"},
                {name: "Статус", key: "status",},
                // {name: 'Дата', key: 'date'},
            ],
        },

    },
};

let admin_urls = to_url_arr(global.CONFIG.urls);
const router = createBrowserRouter([
    {
        path: "/",
        element: <Root/>,
        children: [
            {
                path: "profile",
                element: Loader("Profile")(),
            },
            {
                path: "table",
                element: Loader("Suggest/Table")(),
            },
            {
                path: "dashboard",
                element: Loader("Dashboard")(),
            },
            {
                path: "run",
                element: Loader("CodeRunWrap")(),
            },
            {
                path: "run-by-quiz",
                element: Loader("CodeRunWrapQuiz")(),
            }, {
                path: "video",
                element: Loader("UploadVideo")(),
            },{
                path: "file",
                element: Loader("UploadFile")(),
            },
            {
                path: "quiz/:id",
                element: Loader("RunExam")(),
            },
            {
                path: "courses/:id",
                element: Loader("Suggest/CourseDetails")(),
            },
            {
                path: "courses",
                element: Loader("TrainMethods/CoursesListOld")(),
            }, {
                path: "mic",
                element: Loader("MicTest")(),
            },
            {
                path: "main",
                element: Loader("TrainMethods/CoursesList")(),
            },

            {
                path: '/temp', element: <>
                    {/* <div className='mainCont' style={{marginTop: '20px', marginRight: '20px'}}> */}
                    <div className={'list-integration'}>
                        <Link to={'/temp/features-tree'}>Дерево функционала</Link>
                        <Link to={'/temp/projects'}>Проекты</Link>
                    </div>
                    <Outlet></Outlet>
                    {/* </div> */}

                </>, children: [
                    {
                        path: "features-tree",
                        element: Loader('CvTree/Tree')()
                    }, {
                        path: "projects",
                        element: Loader('CvTree/ActiveProjects')()
                    },
                ]
            },
            {
                path: "train",
                element: <TrainPage/>,
            },
        ].concat(admin_urls),
    },
    {
        path: "404",
        element: <div>404</div>,
    },

    {
        path: "login",
        element: <Login/>,
    },
    {
        // path: 'test/:id',
        // element: <RunExam/>
    },
]);

function Loader(path) {
    function def() {
        return function (props) {
            return <Skeleton label={path}></Skeleton>;
        };
    }

    try {
        let _path =
            "./" +
            path.replace(".js", "").replace("./", "").replace(/^\//gi, "") +
            ".js";

        if (files.indexOf(_path) > -1) {
            let Comp = require("./comps/" + path).default;
            return function (props) {
                return <Comp props={props}></Comp>;
            };
        } else {
            //console.log("*........ ## AA FALSE", files);
            return def();
        }
    } catch (e) {
        //console.log("*........ ## root eee", e);
        return def();
    }
}

global.Loader = Loader;

function Root() {
    let [count, setCount] = useState(0);

    global.UpdateRootFn = () => {
        setCount(new Date().getTime());
    };
    let location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        // mediaInit()
    })
    global.navigate = navigate;
    global.redirect = redirect;

    // React.useEffect(() => {
    //     // console.log('*........ ## location changed');
    // }, [location]);

    let path = /team/gi.test(window.location.pathname)
        ? "Layouts/Layout2"
        : "Layouts/Layout1";
    let Item = Loader(path);

    if (window.location.pathname == "/") {
        setTimeout(() => {
            // navigate('/')
            navigate("/main");
        }, 100);
    }

    return (
        <>
            {/*<DisableScreenWhenTrain>*/}
            <DynamicStyle></DynamicStyle>
            <Item></Item>
            <Player></Player>
            {/*</DisableScreenWhenTrain>*/}

        </>
    );
}

// console.log('*........ ## router', router);
createRoot(document.getElementById("root")).render(
    <RouterProvider router={router}/>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

function Team(props) {
    return <div>Commented</div>;
}
