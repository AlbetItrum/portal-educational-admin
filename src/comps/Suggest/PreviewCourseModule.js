import React, {useEffect, useState} from 'react';
import _ from 'underscore';
import './PreviewCourseModule.css'
import QuestionDetails from "./QuestionDetails";
import MdPreview from "./MdPreview";
import MDEditor from "@uiw/react-md-editor";
import Button from "../../libs/Button";
import QuizTraining from "./QuizTraining";
import RunQuiz from "./RunQuiz";
import MyModal from "../../libs/MyModal";
import {Link} from "react-router-dom";
import {generateSuggestion} from "./SuggestionItem";
import CustomStorage from "./CustomStorage";
import CourseQuiz from "./CourseQuiz";
import {StarRating} from "../StarRating";
import {Videos} from "../Suggest/QuestionDetails"
import Train from "../TrainMethods/Train";

function PreviewCourseModule(props) {
    let {
        onOpenNextModule,
        qHistory,
        mHistory,
        isLastModule,
        courseUserId,
        onChangeQHistory,
        onChangeMHistory,
        questions,
        dbQuestionsObj,
        moduleId,
    } = props;
    let isAdmin = global.env.isAdmin || props.isAdmin;

    let [selectedBlockInd2, setSelectedBlockInd] = useState(0);
    let selectedBlockInd = props.selectedBlockInd;
    questions = questions || [];
    let selectedBlock = props.selectedBlock || questions[selectedBlockInd];
    let loading = props.loading;
    useEffect(() => {
        setSelectedBlockInd(props.selectedBlockInd)
       //console.log("set Selected Block ind")
    }, [props.selectedBlockInd])
    // useEffect(() => {
    // }, [selectedBlockInd])

    function _onOpenNextModule() {
        let activeQInd = getActiveQId();
        if (activeQInd === questions.length - 1) {
            onOpenNextModule && onOpenNextModule()
        } else {
            setSelectedBlockInd(activeQInd)
        }

    }

    useEffect(() => {
        selectedBlockInd !== -4 && onAction('change_selection', selectedBlock)
    }, [selectedBlock])


    useEffect(() => {
        let activeInd = getActiveQId()
        selectedBlockInd !== activeInd && setSelectedBlockInd(activeInd > questions.length - 1 ? -1 : activeInd)
    }, [questions])


    function scrollToView(selector = '#topicsList') {

        try {

            document.querySelector(selector).scrollIntoView({
                behavior: 'smooth', // Add smooth scrolling behavior
                block: 'start',     // Align the top of the element with the top of the container
            });
        } catch (e) {

           //console.log("qqqqq scroll to view bug", e);
        }

    }

    // window.scrollToView = scrollToView;

    function openInNewTab(url) {
        window.open(url, '').focus();
    }


    function onAction(type, data) {
       //console.log("on ACtion !!!!! ", type, data)
    }


    function onSelectInd(ind) {
        setSelectedBlockInd(-4);
        setTimeout(() => {
            setSelectedBlockInd(ind)
        }, 10)
    }

    function isActiveOk(ind) {
        if (isAdmin) {
            return true;
        }
        if (ind == -1) {
            return activeQInd >= questions.length - 1 && (qHistory[(questions[questions.length - 1] || {})._id || '_id_not_found'] || {}).status == 'ok';
        }
        return (activeQInd) >= ind;
    }

    function getActiveQId() {
        let activeQInd = 0;
        let isBad;

        _.each(questions || [], ({_id}, ind) => {
            let status = ((qHistory || {})[_id] || {}).status;
            if (status !== 'ok') {
                isBad = true;
            }
            if (!isBad) {
                activeQInd = ind + 1;
            }
        })
        return activeQInd
    }

    qHistory ??= {};
    let activeQInd = getActiveQId();
    let it = selectedBlock;
    let qId = (selectedBlock || {})._id;
    let isOk = props.isActive ? props.isActive.status : isActiveOk(selectedBlockInd)


    function isSimpleName(block) {
        block = block || {}
        return /js-task/gi.test(block.type) || (((block || {}).name || '').split('\n').length > 1) ? false : true;
    }


    if (loading) {
        return <></>
    }

    let delay = 0;

    function getDelay() {
        delay = delay + 50;
        return 0;//delay + 'ms'
    }


    return <div>
        {!isOk && <div className="cmMainBlocks">
            <div className={'emptyModule'}>
                <div className="fa fa-lock" style={{fontSize: '30px'}}></div>
                <div></div>
                Модуль будет открыт после <br/>успешного прохождения предыдущих модулей
            </div>
        </div>}
        {isOk && <div className="cmMainBlocks">
            {selectedBlock && <div className='animChild'>

                <QuestionDetailsNew item={selectedBlock}
                                    answerSubType={'course'}
                ></QuestionDetailsNew>


                <div className={'afade'} style={{animationDelay: '.4s'}}>
                    <hr/>

                    {<>
                        <CourseQuiz
                            onAction={onAction}
                            title={"Проверить знания"}
                            questionId={selectedBlock._id}
                            moduleId={moduleId}
                            courseUserId={courseUserId}
                            onSuccess={(r) => {
                                let questionId = selectedBlock._id;
                                onChangeQHistory({...qHistory, [questionId]: r})
                                scrollToView();

                               //console.log("qqqqq question is submitted ON SUCCSSESS",);
                            }}
                        ></CourseQuiz>

                        <hr/>

                    </>}


                    <div className="w100 tc">
                        {/* <div className="ib" > */}
                        <StarRating question={selectedBlock}></StarRating>
                        {/* </div> */}
                        {/* <div className="ib" style={{ position: 'relative', marginLeft: '20px', zIndex: '200' }}>
                            <a  onClick={() => {
                                generateSuggestion(selectedBlock._id)
                            }}>
                                <i className="fa fa-pencil" style={{marginRight: '10px' }}></i>
                                Улучшить ответ
                            </a>
                        </div> */}
                    </div>

                    <hr/>
                    <div className="w100 tc">


                        <button className={'btn btn-sm btn-default'}
                                onClick={() => {
                                    props.onChangeInd(-1)
                                    // onSelectInd(selectedBlockInd < 1 ? -1 : selectedBlockInd - 1)
                                    // scrollToView('#topicsList')
                                }}
                        >Предыдущая глава
                        </button>
                        <button className={'btn btn-sm btn-default'}
                                onClick={() => {
                                    props.onChangeInd(1)
                                    // onSelectInd(selectedBlockInd == questions.length - 1 ? -1 : selectedBlockInd + 1)
                                    // scrollToView('#topicsList')
                                }}
                        >Следующая глава
                        </button>

                    </div>
                </div>

            </div>}

            {selectedBlockInd === -1 && <div className="cmMainActions animChild" id={'examStart'}>
                <h2 className={'cmTitle'}>Закрепление информации</h2>

                <hr/>
                <div style={{padding: '10px 0 30px 0'}}>Молодец, ты закончил
                    изучение {isLastModule ? 'курса' : 'модуля'}!
                </div>
                <div className="w100">
                    <CourseQuiz
                        onAction={onAction}
                        title={"Проверить знания"}
                        moduleId={moduleId}
                        isLastModule={isLastModule}
                        courseUserId={courseUserId}
                        onSuccess={(r, cb) => {
                            onChangeMHistory({[moduleId]: r}, cb)
                            scrollToView();
                        }}
                    ></CourseQuiz>
                </div>
            </div>}
        </div>}
    </div>
}



export function QuestionDetailsNew(props) {

    let [httpItem, setHttpItem] = useState({})
    let {questionId, answerSubType} = props;
    let it = props.item || httpItem;
    let selectedBlock = it;

    function isSimpleName(block) {
        block = block || {}
        return /js-task/gi.test(block.type) || (((block || {}).name || '').split('\n').length > 1) ? false : true;
    }

    useEffect(() => {
        questionId &&
        global.http
            .get("/load-question-from-exam", {question: questionId})
            .then(({question}) => {
                setHttpItem(question || {});
            });
    }, [questionId]);


    useEffect(() => {
        let hash = new Date().getTime();
        if (it && it._id) {


            global.http.get('/question-history', {cd: new Date().getTime(), hash, answerSubType, status: 'start', question: it._id}).then()
        }
        return () => {
            it && it._id && global.http.get('/question-history-stop', {cd: new Date().getTime(), hash, answerSubType, status: 'stop', question: it?._id}).then()
            return true;
        }
    }, [it?._id])

    let delay = 0;

    function getDelay() {
        delay = delay + 50;
        return 0;
    }


    if (!it._id) {
        return '-'
    }
    return <>
        {it.title && <h2 className={'cmTitle afade'} style={{animationDelay: getDelay()}}>
            {it.title}</h2>}

        {selectedBlock.type === 'js-task' && <>
        
            <hr/>
        </>}
        {isSimpleName(selectedBlock) ? <h2 className={'cmTitle afade'} style={{
                animationDelay: getDelay(),
                marginBottom: '10px'
            }}>{selectedBlock.name}</h2> :
            <MDEditor.Markdown
                source={selectedBlock.name}></MDEditor.Markdown>}
        <Videos items={selectedBlock.videos}/>
        {selectedBlock.answer && <MDEditor.Markdown source={selectedBlock.answer}/>}
        {selectedBlock.useCases && <div className=''>
            {(selectedBlock.useCases || []).map((it, ind) => {
                return (<div key={ind} className='animChild'>
                    <h3 className={'h3Title'}>{it.name}</h3>
                    {it.desc && <MDEditor.Markdown source={it.desc}/>}
                </div>)
            })}
        </div>}
        {selectedBlock.facts && <div>
            {(selectedBlock.facts || []).map((it, ind) => {
                return (<div key={ind} className='animChild'>
                    <h3 className={'h3Title'}>{it.name}</h3>

                    {it.desc && <MDEditor.Markdown source={it.desc}/>}
                </div>)
            })}
        </div>}</>
}

export default PreviewCourseModule
