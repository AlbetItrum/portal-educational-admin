import React, {useState, useEffect, useRef} from 'react';
import _ from 'underscore';
import Button from 'libs/Button'
import {
    Link, Outlet
} from "react-router-dom";
import CodeRun from "./Suggest/CodeRun";
import MDEditor from "@uiw/react-md-editor";
// import Editor from "@monaco-editor/react";
import './RunExam.css';
import MyModal from "../libs/MyModal";
import RunQuiz from "./Suggest/RunQuiz";
import QuizPreview from "./Suggest/QuizPreview";
import RenderQuizResults from "./Suggest/RenderQuizResults";
import Loading from "../libs/Loading/Loading";
import LogsStarterPreview from "./Suggest/LogsStarterPreview";
import LazyEditor from "./LazyEditor/LazyEditor";
import Train from "./TrainMethods/Train";
// import Editor from './Suggest/LazyEditor/LazyEditor'
let timer = {}

function CountDown(props) {
    let [cd, setCd] = useState(new Date().getTime())
    let [isShown, setIsShown] = useState(false);
    let {end} = props;

    let delta = Math.max(0, Math.round((props.end - cd) / 1000));
    let minutes = Math.round(delta / 60);
    let hours = Math.floor(minutes / 60);
    let seconds = Math.round(delta % 60)
    minutes = minutes % 60;

    let {warning, onWarning} = props;

    function pub(v) {
        return v < 10 ? '0' + v : v;
    }

    let mins = pub(minutes);
    let hs = pub(hours);

    useEffect(() => {
        if (!delta) {
            props.onEnd && props.onEnd()
        }
    }, [delta])
    useEffect(() => {
        let str = hs + ':' + mins;
        if (!isShown && str === warning) {
            setIsShown(true)
            onWarning && onWarning(str)
        }
    }, [cd])
    useEffect(() => {
        const timer = setInterval(() => {
            setCd(new Date().getTime());
        }, 1000);

        return () => {
            clearInterval(timer);
        };
    }, []);


    return <div className={'ib countdown'} style={{marginRight: '5px'}}>{hs} <span
        className={'countdots'}>:</span> {mins}</div>
}


function RunExam(props) {
    let [exam, setExam] = useState({})
    let [dbQuestions, setDbQuestions] = useState([])
    let [submitLoading, setSubmitLoading] = useState(false)
    let [jsObj, setJsObj] = useState({})
    let [history, setHistory] = useState({})
    let [loading, setLoading] = useState(true)
    let [selectedInd, setSelectedInd] = useState(0)


    function getExamId() {
        return window.location.href.split('/quiz/')[1]
    }

    function updateExam(obj, question) {
        let SEND_DELAY = 1
        clearTimeout(timer[question]);
        timer[question] = setTimeout(() => {

            global.http.post('/update-exam', {
                files: obj.files,
                logsReader: obj.logsReader,
                quizHistory: {...obj.quizHistory || {}, data: null},
                exam: exam._id,
                curCasesStr: obj.curCasesStr, question
            }).then(r => {
                //console.log('update exam here', r)
            })
        }, SEND_DELAY)

    }


    useEffect(() => {
        loadExam()
    }, [])

    function loadExam() {
        setLoading(true)
        global.http.get('/load-exam', {_id: getExamId()}).then(exam => {
            setExam(exam)
            setLoading(false)
            _.each(exam.dbQuestions, q => {
                let jsDetails = _.filter(exam.jsDetails, it => it.question === q._id)[0]
                jsObj[q._id] = (jsDetails || {}).details;
            })
            let history = {}
            _.each(exam.history, q => {
                history[q._id] = q.last
            })

            setJsObj(jsObj)
            setHistory(history)
            setSelectedInd(exam.quizQuestionsCount ? -1 : 0)

            setDbQuestions(exam.dbQuestions)
        })
    }

    let question = dbQuestions[selectedInd] || {}
    let SUBMIT_DEFAULT = exam.availableSubmitCount || 0;

    function canSubmit() {
        return (exam.submitCount || 0) < (SUBMIT_DEFAULT || 0)
    }

    function getMinutes(exam) {
        let arr = (exam.minutesStr || '').split('\n')
        //console.log("qqqqq getMinutesgetMinutesgetMinutes", arr, exam, exam.attemptInd < 1);
        if (!exam.attemptInd) {
            return parseFloat(arr[0]) || 60
        } else {
            return arr[exam.attemptInd]
        }


    }


    let submitDetails = exam.submitDetails || {};

    function getEndDate(exam) {
        let startCd = exam.startCd;
        let minutes = getMinutes(exam);
        return new Date(startCd).getTime() + minutes * 1000 * 60;
    }

    function onSubmit(scb, ecb) {
        setSubmitLoading(true)
        global.http.get('/submit-task-by-user', {_id: exam._id})
            .then(r => {
                //console.log("qqqqq rrrr", r);
                setExam(r)
                scb && scb();
                setSubmitLoading(false)
            })
    }


    let warningModal = useRef(null);

    if (loading) {
        return <Loading loading={true}/>
    }
    if (/unactive/gi.test(exam.status)) {
        return <div style={{padding: '20px', textAlign: 'center'}}>Экзамен не активен</div>
    }

    if (/active|pending/gi.test(exam.status)) {
        let isPending = exam.status === 'pending';
        return <div style={{padding: '20px', textAlign: 'center'}}>
            Экзамен #{getExamId()}
            <div>
                Время на выполнение: {getMinutes(exam)} мин
                <hr/>
            </div>
            {isPending && <div>
                Дождитесь пока модератор сделает доступным этот экзамен
                <div style={{marginTop: '20px'}}></div>

                <Button disabled={true}>Начать экзамен</Button>
            </div>}
            {!isPending && <Button onClick={(scb, ecb) => {
                global.http.get('/user-start-exam', {_id: getExamId()})
                    .then(exam => {
                        setExam(exam)
                        setSelectedInd(exam.quizQuestionsCount ? -1 : 0)
                        scb && scb()
                        loadExam();
                    })
                    .catch(ecb)
            }}>Начать экзамен</Button>}
        </div>
    }

    if (exam.status === 'submitted' || submitLoading) {
        window.onRenderLeftMenu && window.onRenderLeftMenu(null)
        return <>
            <div className={'mainCont2 ' + (submitLoading ? 'o4' : '')} style={{padding: '20px'}}>
                <Link to={'/quiz'}>
                    <i className="fa fa-arrow-left"
                       style={{marginRight: '10px', marginTop: '1px', float: 'left'}}></i> Вернуться</Link>


                <RenderQuizResults exam={exam} history={history}></RenderQuizResults>
                {(dbQuestions || []).map((it, ind) => {
                    let qId = it._id;
                    let perc = submitDetails[qId] ? submitDetails[qId].perc : -1;
                    let hist = history[qId] || {};
                    let code = (hist.files || {})['']
                    let logsReader = hist.logsReader || ''
                    let jsDetails = jsObj[qId] || {};
                    let files = Object.keys(hist.files || {}) || [''];
                    let isLogsReader = jsDetails.codeType == 'logreader'
                    //console.log("qqqqq logsReaderlogsReaderlogsReader", history, logsReader, isLogsReader, it);

                    return (<div key={ind} className={'row qHistory ' + (selectedInd == ind ? 'active' : '')}
                                 onClick={() => {
                                     setSelectedInd(ind)

                                 }}>
                        <div className="col-sm-12">
                            <hr/>
                        </div>
                        <div className="col-sm-6" style={{maxHeight: '350px', overflow: 'auto'}}>
                            <b>Task #{ind + 1}</b>
                            {exam.submitDetails && <div className={'taskProgress'} style={{maxWidth: '100px'}}>
                                <div
                                    className={"taskProgressValue " + (perc < 30 ? 'error' : perc < 70 ? 'norm' : 'good')}
                                    style={{width: (perc + '%')}}></div>
                            </div>}

                            <MDEditor.Markdown
                                style={{maxHeight: '200px'}}
                                source={it.name}></MDEditor.Markdown>

                            {isLogsReader && <div>
                                <LogsStarterPreview _id={it._id}></LogsStarterPreview>
                            </div>}
                        </div>
                        <div className="col-sm-6">
                            {isLogsReader && <>
                                <small>{'Ответ'}</small>
                                <LazyEditor
                                    options={{domReadOnly: true}}
                                    language={'javascript'}
                                    value={logsReader}
                                    height={'300px'}></LazyEditor></>}
                            {!isLogsReader && (files || []).map((fileName, ind) => {
                                let code = (hist.files || {})[fileName] || ''
                                return (<div key={ind}>
                                    <small>{fileName || 'index.js'}</small>
                                    <LazyEditor
                                        options={{domReadOnly: true}}
                                        language={'javascript'}
                                        value={code}
                                        height={'300px'}></LazyEditor>
                                </div>)
                            })}


                        </div>

                    </div>)
                })}

                {!((exam || {}).quizQuestionsPlain || []).length && !(dbQuestions || []).length && <>
                    <hr/>
                    <div className={'tc'}
                         style={{
                             fontSize: '30px',
                             fontWeight: 'bold',
                             textAlign: 'center', width: '100%', padding: '50px 10px'
                         }}>

                        Нет корректных данных об этом экзамене
                    </div>
                </>}
            </div>
        </>
    }

    let Comp = () => {
        return <div className='examMenu'>
            <div className='examCount'><small>Осталось:</small> <CountDown end={getEndDate(exam)}
                                                                           warning={'00:05'}
                                                                           onWarning={(time) => {
                                                                               warningModal.current.show();
                                                                           }
                                                                           }
                                                                           onEnd={() => {
                                                                               //console.log("qqqqq onENd onEnd",);
                                                                               onSubmit()
                                                                           }
                                                                           }
            ></CountDown></div>
            {canSubmit() && <Button forceDisabled={!canSubmit()}
                                    forceClassName={'btn btn-lg btn-default'}
                                    onClick={(scb, ecb) => {
                                        canSubmit() && global.http.get('/attempt-to-run', {_id: exam._id})
                                            .then(r => {
                                                //console.log("qqqqq rrrr", r);
                                                setExam(r)
                                                scb && scb();
                                            })
                                    }
                                    }>
                <div className={'btncheck0'}>Проверить</div>
                <div className={'btncheck'}><small>Осталось попыток
                    ({Math.max(SUBMIT_DEFAULT - exam.submitCount, 0)})</small></div>
            </Button>}
            <Button

                forceDisabled={submitLoading}
                onClick={(scb) => {
                    //console.log("qqqqq click", );
                    onSubmit(scb)
                }}>
                <div className={'btncheck0'}>Завершить тест</div>
                <div className={'btncheck'}><small>Отправить все задачи</small></div>
            </Button>

            <hr/>
            {Boolean(exam.quizQuestionsCount) && <div
                onClick={() => {
                    setSelectedInd(-1)
                }}
                className={'questionRunExam ib mr15 ' + (selectedInd == -1 ? 'active' : '')}>
                Вопросы ({exam.quizQuestionsCount})
            </div>}
            {(dbQuestions || []).map((it, ind) => {
                let qId = it._id;
                let perc = submitDetails[qId] ? submitDetails[qId].perc : -1;
                return (<div key={ind} className={'questionRunExam rel ib mr15 ' + (selectedInd == ind ? 'active' : '')}
                             onClick={() => {
                                 setSelectedInd(ind)

                             }}>
                    Task #{ind + 1}
                    {/* {exam.submitDetails && <div className={'taskProgress'}>
                        <div className={"taskProgressValue " + (perc < 30 ? 'error' : perc < 70 ? 'norm' : 'good')}
                             style={{width: (perc + '%')}}></div>
                    </div>} */}
                </div>)
            })}
        </div>
    }
    window.onRenderLeftMenu && window.onRenderLeftMenu(Comp)
    //
    //
    // let setQuizIdHist = (quizId, data) => {
    //     let questionId = -1;
    //     history[questionId] ??= {}
    //     history[questionId].quizHistory ??= {}
    //     history[questionId].quizHistory.history ??= {}
    //     history[questionId].quizHistory.history[quizId] = {...history[questionId].quizHistory.history[quizId] || {}, ...data || {}}
    //     //console.log("qqqqq  history[questionId].quizHistory.history[quizId] ",  history[questionId].quizHistory.history[quizId] );
    //     // history[questionId].quizHistory.history ??= {}
    //     // {...history[questionId].quizHistory, [quizId]: chosen};
    //     setHistory(history)
    //     updateExam(history[questionId], questionId)
    // }
    //console.log("qqqqq exam", exam, history, dbQuestions);
    //console.log("qqqqq historyhistoryhistoryhistory", history);
    console.log('historyObj!!3333344', JSON.stringify(history[-1], null, 4))

    return <div>
        <div style={{padding: '0 0', width: '100%', float: 'right'}}>

            <div className="pull-right btns-check-wrap">

                <MyModal
                    size={'small'}
                    ref={warningModal}
                >
                    <div className="tc">
                        У вас осталось
                        <div></div>
                        <CountDown
                            end={getEndDate(exam)}

                        ></CountDown>
                        <div>
                            <hr/>
                        </div>
                        <Button onClick={(scb) => {
                            warningModal.current.hide();
                            scb && scb();
                        }}>Спасибо, за напоминание</Button>
                    </div>
                </MyModal>

                {/*<Button className={'btn btn-lg btn-primary'} onClick={(scb) => {*/}
                {/*    //*/}
                {/*}*/}
                {/*}>*/}
                {/*   */}
                {/*</Button>*/}
            </div>
        </div>
        {/*<RenderQuizResults exam={exam} history={history}></RenderQuizResults>*/}

        {selectedInd == -1 && <div className={'ib w100 tc '}>
            <div className="quizWrapRunExam">
                <div className="quizWrapRunExamChild">
                    <Train
                        getNextInd={(ind, items) => {
                            return ++ind % items.length;
                        }}
                        preSendFBAQ={(info) => {
                            console.log("qqqqq info", info);
                            info.opts = info.opts || {};
                            info.opts.exam = exam._id;
                            return info;
                        }}
                        getItemNameAndDesc={(item, props) => {
                            console.log("qqqqq GET TITLE & NAME [[ ", item, props);
                            // let smallTitle = item.specialType != 'general' ? getGeneralTitle(item) : ''
                            return pubGeneralTitle(item)
                        }}
                        getCodeFiles={(item, hist, isRestart) => {
                            console.log("qqqqq histtttttttttttt", item, hist);
                            let values = (hist || {}).values || [];

                            function pubItem(item, ind) {
                                if (!isRestart) {
                                    item.code = (values[ind] || {}).code || item.code;
                                }
                                item.lng = getLng(item.name)
                                // item.code = replaceCode(item.code)
                                return item
                            }

                            return {
                                activeFileInd: 0,
                                items: (item.files || []).map(pubItem)
                            }
                        }}
                        getStartAudioAttempt={(ind) => {
                            console.log("qqqqq GET START Audio Attempt [[ ", ind);
                            return 0;
                        }}


                        onChangeTime={(time, timers, activeInd) => {
                            // console.log("qqqqq CHANGE TIME", time, timers, activeInd);
                        }}
                        getStartTimers={getStartTimers}
                        getDefaultQuizTime={getDefaultQuizTime}

                        onResult={(history) => {
                            console.log("qqqqq ON RESULT course Quiz", history);
                            // setQuizResults(true)
                            return null
                        }}
                        onChangeHistory={(quizHistory, quizId) => {
                            // if (!quizHistory.quizId) return;
                            // console.log("qqqqq vvvv445", history, quizHistory)
                            let questionId = -1
                            history[questionId] ??= {}
                            history[questionId].quizHistory = quizHistory;
                            setHistory(history)
                            console.log("qqqqq ON CHANGE HISTORY QUIZ ]]", quizHistory);
                            updateExam(history[questionId], questionId)
                        }}
                        onChange={(quizHistory) => {
                            console.log("qqqqq ON CHANGE QUIZ ]]", quizHistory);
                            // let {data = {}, answerType} = v;
                            let questionId = -1
                            history[questionId] ??= {}
                            history[questionId].quizHistory = quizHistory;
                            setHistory(history)
                            updateExam(history[questionId], questionId)
                            // let {quizPerc, total} = getQuizPerc(v)
                            // //console.log("qqqqq quiz Perc ]]] ", quizPerc, total, v);
                            // setQuizPerc(quizPerc);
                            // if (answerType === 'quiz' && !data.isCorrect) {
                            //     setQuizResults(true)
                            // }
                        }}
                        onSubmit={(v1, v2, v3) => {
                            let quizHistory = v1;
                            // if (!quizHistory.quizId) return;
                            // console.log("qqqqq vvvv445", history, quizHistory)
                            let questionId = -1
                            history[questionId] ??= {}
                            history[questionId].quizHistory = quizHistory;
                            setHistory(history)
                            console.log("qqqqq ON SUBMIT course QUIZ ]]", quizHistory);
                            updateExam(history[questionId], questionId)
                        }}
                        onReStartAttempt={(v) => {
                            console.log("qqqqq ON RESTART_ATTEMPT course QUIZ ]]", v);
                        }}
                        onStart={(v) => {
                            console.log("qqqqq ON START course QUIZ ]]", v);
                        }}
                        onReStart={(v) => {
                            console.log("qqqqq ON RE_START course QUIZ ]]", v);
                        }}
                        onStop={(v) => {
                            console.log("qqqqq ON STOP on Stop ]]", v);
                        }}
                        getStartItems={async () => {
                            console.log("qqqqq GET START ITEMS [[ ", exam.quizQuestionsPlainPub);
                            return exam.quizQuestionsPlainPub
                        }}
                        getStartIndex={(items, history) => {
                            // return 7
                            let startInd = -1;
                            let isAlreadyNotEmpty = false;
                            let timers = getStartTimers(items, history)
                            _.each(items, ({item}, ind) => {
                                let hist = history[item._id] || {}
                                let isSubmitted = hist.hash || _.size(hist.chosen)
                                let timersItem = timers[ind] || {}
                                if (timersItem.totalTime && !timersItem.time) {
                                    return;
                                }
                                if (!isSubmitted && !isAlreadyNotEmpty) {
                                    startInd = ind;
                                    isAlreadyNotEmpty = true;
                                    // console.log("qqqqq itemtmtmtmtmtmmt",
                                    //     {startInd, isAlreadyNotEmpty, isSubmitted}, item, timers, hist);
                                }

                            })
                            console.log("qqqqq items4446666", startInd, items, history);

                            if (startInd == -1) {
                                return -1;
                            }
                            // console.log("qqqqq GET START Index [[ ", 1);
                            return startInd;
                        }}
                        getStartHistory={() => {
                            console.log('historyObj!!33333', JSON.stringify(history[-1], null, 4))

                            let hist = (((history || {})[-1] || {}).quizHistory || {}).history;
                            console.log("qqqqq cHHHHHHHHHHHHHHHHHHHHHHHH quizzzzzzzzzzzzzzzzzzzzz!!", hist, JSON.stringify(history, null, 4));
                            //START HISTORY __________
                            // return {};
                            return hist || {};
                        }}
                        Result={RestulExamPage}
                        opts={{
                            uploadAudioUrl: '/api/upload-audio',
                            codeChangeUrl: '/code-typing',
                            plainCodeChangeUrl: '/code-typing',
                            isExam: true,
                            woClickTopCircleNavigation: true,
                            woTopCircleNavigation: false,
                            // resetTimeOnClickItem: true,

                            woUploadAudio: false,
                            startWebCam: false,
                            preventOnNext: false,
                            textToVoiceTimeoutMS: 0,
                            textToVoiceSpeedMSPerSymbolLimit: 100,
                            msForRecognitionInnerProcess: 1000,
                            playTextSpeechBeforeQuiz: true,
                            playTextSpeechAfterAudioRecord: false,
                            canResubmitQuiz: false,
                            showGrowTags: false,
                            woNext: false,

                            debugCompareRateOnCodeChange: true,

                            MSBeforeAudioStart: 100,
                            isErrRec: true,
                            quizExam: 600,
                            quizOpenNextExam: 600,
                            quizOpenNextIfCorrectMs: 600,
                            quizOpenNextIfIncorrectMs: 5000,
                            maxAttemptsCount: 5,
                            attemptsForNextIfNot5: 2
                        }}
                    >
                    </Train>
                    {/*<hr/>*/}
                    {/*<hr/>*/}
                    {/*<RunQuiz isExam={true}*/}
                    {/*         skipBottomOpenText={true}*/}
                    {/*         quizHistory={(history[-1] || {}).quizHistory}*/}
                    {/*         items={exam.quizQuestionsPlain}*/}
                    {/*         onChange={(quizHistory) => {*/}
                    {/*             if (!quizHistory.quizId) return;*/}
                    {/*             console.log("qqqqq vvvv445", history, quizHistory)*/}
                    {/*             let questionId = -1*/}
                    {/*             history[questionId] ??= {}*/}
                    {/*             history[questionId].quizHistory = quizHistory;*/}
                    {/*             setHistory(history)*/}
                    {/*             updateExam(history[questionId], questionId)*/}
                    {/*         }*/}
                    {/*         }>*/}
                    {/*</RunQuiz>*/}
                </div>
            </div>
        </div>}
        {selectedInd !== -1 && <CodeRun
            isNewExam={true}
            question={question}
            onChangeCurStr={(v) => {
                if (question && question._id && v) {
                    let questionId = question._id;
                    history[questionId] ??= {}
                    history[questionId].curCasesStr = v;
                    setHistory({...history})
                    updateExam(history[questionId], questionId)
                }

            }}
            onChangeCode={(v, file) => {
                file = file || ''
                let questionId = question._id;
                history[questionId] ??= {}
                history[questionId].files = {...history[questionId].files, [file]: v}
                setHistory({...history})
                //console.log("qqqqq on change code is changed", history[questionId], history, questionId);

                updateExam(history[questionId], questionId)
            }
            }
            onChangeLogs={(v) => {
                //console.log("qqqqq change logs", v);
                let questionId = question._id;
                history[questionId] ??= {}
                history[questionId].logsReader = v;
                setHistory({...history})

                updateExam(history[questionId], questionId)

            }
            }
            history={(history || {})[question._id]}
            jsDetails={jsObj[question._id]}
            isExam={true}></CodeRun>}


    </div>
}


export function getLng(fileName) {
    let ext = (fileName || '').trim('').split('.').pop();
    console.log("qqqqq ext", ext);
    let extensions = {
        'js': 'javascript',
        'jsx': 'javascript',
        'ts': 'javascript',
        'htm': 'html',
        'html': 'html',
        'xhtml': 'html',
        'md': 'md',
        'tsx': 'javascript',
        'css': 'css',
        'scss': 'scss',
        'less': 'less',
        'ja': 'java',
        'py': 'python',
        'txt': 'text',
    }
    return extensions[ext] || 'md'
}
export function getDefaultQuizTime(item) {
    let {answerType, time} = item?.item || item;
    if (time) {
        return time
    }
    answerType = answerType || 'quiz'
    return answerType === 'audio' ? 120 :
        answerType === 'quiz' ? 40 :
            answerType == 'code' ? 150 : 40
}


export function getStartTimers(items, history) {
    console.log("qqqqq GET START TIMERS [[ ", items, history);

    let obj = {};
    _.each(items, (item, ind) => {
        let _id = ((item || {}).item || {})._id
        let cd = +((history || {})[_id] || {}).cd
        let time = getDefaultQuizTime(item)
        console.log("qqqqq timer3333", time, item);
        let delta = cd ? Math.round((new Date().getTime() - cd) / 1000) : 0;
        if (cd) {
            obj[ind] = {
                time: Math.max(0, time - delta),
                totalTime: time
            }
        } else {
            obj[ind] = {
                time, totalTime: time
            }
        }
    })

    console.log("qqqqq timer333344", obj);
    return obj;

}

function RestulExamPage(props) {
    console.log("qqqqq result pageeeee", props);
    return <div className={'tc'} style={{padding: '50px 0', fontSize: '24px'}}>Поздравляем, вы прошли все тесты!
        <div></div>Теперь можете приступить к задачам или завершить экзамен!</div>
}


export function pubGeneralTitle(item) {
    let {answerType, specialName, specialTitle, specialType, specialQuestionType} = item;
    console.log("qqqqq item44444", specialTitle, item);

    let smallTitle = ''
    let isGeneral = specialType == 'general';

    if (isGeneral) {
        if (/task/gi.test(specialQuestionType)) {
            smallTitle = 'Расскажите возможные алгоритмы решения, подводные камни, плюсы и минусы'
            // }
            // if (specialQuestionType == 'task') {
            //     smallTitle = 'Поясните решение'
            // } else if (specialQuestionType == 'js-task') {
            //     smallTitle = 'Поясните решение'
        } else if (answerType !== 'quiz') {
            smallTitle = 'Раскройте вопрос'
        }
        // smallTitle = answerType = 'code' ? 'Поясните решение' : answerType == 'audio' ? 'Осветите тему' : ''
    }
    function getSpecialName () {
        let v = specialTitle ||specialName
        let size = (v || '').length;
        if (size > 200) {
            return ''
        }
        return v;

    }

    let title = getQuizName(item) || getSpecialName() || smallTitle;
    let desc =  isGeneral && title != specialName ? specialName : '';

    console.log("qqqqq smallTitlt", {smallTitle, title, specialTitle, desc});
    return {
        lng: '',
        smallTitle,
        title,
        specialTitle: specialTitle != title ? specialTitle : '',
        desc: [title, specialTitle].indexOf(desc) > -1 ? '' : desc
        // desc: 'item.name MD description !!!'
    }

}


export function getQuizAnyName(quiz) {
    let res = getQuizName(quiz) || quiz?.specialTitle || quiz?.specialName
    console.log("qqqqq quiz4444", quiz, res);
    return res;
}

export function getQuizName (item) {
    let {answerType = 'quiz'} = item;
    if (answerType === 'quiz') {
        return item.name;
    } else if (answerType === 'audio') {
        return item.audioName
    } else if (answerType === 'code') {
        return item.codeName
    } else {
        return 'Unknown Name!!'
    }
}

export default RunExam
