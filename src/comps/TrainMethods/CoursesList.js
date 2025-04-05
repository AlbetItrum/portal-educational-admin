import React, {useEffect, useState} from "react";
import _ from "underscore";
import "./CoursesList.css";
import {Link, Outlet} from "react-router-dom";
import Button from "libs/Button";
import TrainPageCourse from "./TrainPageCourse";
import m from "../../libs/m/m";
import AutoInterview from "./AutoInterview";
import FeedbackReview from "./FeedbackReview";
import Courses from "./Comps/Courses";
import CircularProgress2 from "./Comps/CircularProgress2";
import QuestionsList, {smartLoad} from "./Comps/QuestionList";
import FeedbacksList from "./Comps/FeedbacksList";
import TopStats from "./Comps/TopStats";
import Interviews from "./Comps/Interviews";
import WorkSessions from "./Comps/WorkSessions";
import Statistics from "./Comps/Statistics";
import {
    createAutoInterview,
    getAllQuestions,
    getDBQuizes,
    getSortedQuizesByQuestion,
    getTotalStats,
    sortFn
} from "./Comps/mainMethods";
import {stopAnyPlay} from "../../App";
import {recognitionInit, recognitionStart, recognitionStop} from "./AudioShort/AudioShort";

function getRecentlyOpenCd (it) {
    let _id = it?._id || it || -1;
    let items = Storage.get('lastOpenItems') || []
    let item = items.find(it => it._id == _id)

    return item?.cd || 0;
}


function Layout2(props) {
    let [loading, setLoading] = useState(false);
    let [courses, setCourses] = useState([]);
    let [interview, setInterview] = useState(null);
    let [interviewModal, setInterviewModal] = useState(null);
    let [fb, setFb] = useState(null);
    let [res, setRes] = useState({});
    let [open, setOpen] = useState(false);
    let [history, setHistory] = useState({});
    let [modalOpts, setModalOpts] = useState({});
    let [qhistory, setQHistory] = useState({});
    let [visibleQuestions, setVisibleQuestions] = useState([]);
    let [visibleQuestionsObj, setVisibleQuestionsObj] = useState({});
    let [questions, setQuestions] = useState([]);
    let [questionsObj, setQuestionsObj] = useState({});

    console.log("qqqqq visibleQuestionsvisibleQuestions", visibleQuestions, visibleQuestionsObj);
    useEffect(() => {
        reloadAll()
        // recognitionInit()
        // recognitionStart(() => {
        //     console.log("qqqqq titlttl REC START EDDDDDDDDDDD");
        //     recognitionStop()
        // }, () => {
        //     console.log("qqqqq titlttl REC START COMPLLLLLLL");
        // })
    }, []);

    function reloadAll() {
        setLoading(true)
        stopAnyPlay('reload All')
        global.http.get("/load-my-courses-q").then((r) => {
            let {courses, userCourses, questionIds} = r;
            setRes(r);
            setCourses(courses);
            let history = userCourses.reduce((acc, it) => ({...acc, [it.course]: it}), {});
            setHistory(
                history
            );
            let qhistory = {}
            _.each(history, (it, ind) => {
                _.each(it.qHistory, (item, _id) => {
                    qhistory[_id] = qhistory[_id] || {}

                    qhistory[_id].isRead = qhistory[_id].isRead || (item.status == 'ok')
                })
            })

            let {calcQuestion = {}} = r.result || {};
            let questions = ((r.result || {}).questions || []).map(it => {
                return {...it, ...calcQuestion[it._id] || {}, isRead: !!qhistory[it._id]?.isRead}
            });


            let _questionsObj = questions.reduce((acc, it) => ({
                ...acc, [it._id]: {
                    ...it
                }
            }), {});
            let visibleQuestions = questions.filter(it => it.isRead);
            let visibleQuestionsObj = visibleQuestions.reduce((acc, it) => {
                return {...acc, [it._id]: true}
            }, {});
            setQHistory(qhistory)
            setVisibleQuestions(visibleQuestions)
            setVisibleQuestionsObj(visibleQuestionsObj)
            setQuestions(questions)
            setQuestionsObj(_questionsObj)
            setLoading(false)

        });
    }


    //console.log("qqqqq questinosojb", questionsObj, history);

    function clickInterview(interview) {
        setInterview(interview)
        //console.log("qqqqq interivew", interview);
    }

    function clickFeedback(fb) {
        setFb(fb)
        //console.log("qqqqq click fb", fb);
        // global.http

    }


    console.log("qqqqq resresresresres", res);

    async function clickQuestion(item, key) {
        smartClick([item], {total: 7, isExam: false})
        // setOpen(true);
        // setModalOpts({loading: true, quizes: []})
        // let {_id} = item || {};
        // let {quizes, generalQuiz} = (res, _id, key, 5);
        // let dbQuizes = await getDBQuizes(quizes)
        // setModalOpts({loading: false, onQuestion: true, quizes: dbQuizes})

        //console.log("qqqqq quizes!! 1", quizes.map(it => it?.calc));
        //console.log("qqqqq quizes!! 2", dbQuizes);
        // let gQuiz = generalQuiz || await loadGeneralQuiz({_id});
    }

    async function clickExam(questions = [], size = 7) {
        // clickCourse(questions || getAllQuestions(), 'exam', size || 10)
    }

    async function clickCourse(questions = []) {
        console.log("qqqqq smartClicksmartClicksmartClick", questions);
        smartClick(questions, {total: 7})
    }

    async function smartClick(questions = [], opts) {
        let {
            total,
            key,
            isExam,
            qSize = 1,
            query,
        } = opts || {};
        let sortKey = opts.sortKey || isExam ? 'nextCd' : 'nextCd'
        let questionsObj = questions.reduce((acc, it) => ({...acc, [it._id || it]: true}), {})

        let {result, userCourses} = res || {};
        let {calcQuestion, questionsWithQuizes, calcQuiz = {}} = result || {};
        // let visibleQuestionsObj = userCourses.reduce((acc, it, ind) => {
        //     return {...acc, ...it.qHistory || {}}
        // }, {})
        // let visibleQuestions = questions.filter(it => (visibleQuestionsObj[it._id] || {})?.status == 'ok')
        console.log("qqqqq quiestions 00", questionsWithQuizes);

        function isNotInQList (key) {
            return !questionsObj[key]
        }

        let allQuizes = Object.keys(questionsWithQuizes).reduce((acc, key) => {
            if (isNotInQList(key)) {
                return acc;
            }
            let it = questionsWithQuizes[key] || []
            return [...acc, ...it.map(it => {
                return {...it, question: key, ...calcQuiz[it._id] || {}}
            })]
        }, [])

        let sortedAllQuizes = _.sortBy(allQuizes, (it) => {
            let cd = it.nextCd || 0;

            let v = cd || getRecentlyOpenCd(it) || 0;
            return isExam ? v : cd;
        });
        console.log("qqqqq allQuizesallQuizesallQuizes", isExam,  questionsWithQuizes, questionsObj, questions, allQuizes);

        let orders = {}
        _.each(sortedAllQuizes, (item, ind) => {
            let questionId = item.question;
            orders[questionId] = orders[questionId] || 0;
            item.order = ++orders[questionId]
        })

        // console.log("qqqqq quiestions 0", visibleQuestions, res);
        // // let grouppedQuizes = _.groupBy(calcQuiz, 'question')
        // console.log("qqqqq quiestions 2", {calcQuestion, calcQuiz});
        console.log("qqqqq quiestions 3", sortedAllQuizes.map(it => it.nextCd));
        console.log("qqqqq quiestions 3", sortedAllQuizes.map(it => it._id));


        let days = 1000 * 24 * 3600;
        let _lastCd = Math.round((new Date().getTime() - 1 * days) / 1000)

        function insertIterations(sortedAllQuizes, {total = 9, quizes = [], order = 1, alreadyQuizes = {}}) {
            let localQuestions = {}
            _.each(sortedAllQuizes, (item, ind) => {
                let {_id, question, order, lastCd} = item;
                if (
                    _lastCd > lastCd &&
                    visibleQuestionsObj[question] && order == 1 && !alreadyQuizes[_id] && !localQuestions[question] && quizes.length < total) {
                    quizes.push(item)
                }
            })
            _.each(sortedAllQuizes, (item, ind) => {
                let {_id, question, order} = item;

                if (visibleQuestionsObj[question] && !alreadyQuizes[_id] && quizes.length < total) {
                    quizes.push(item)
                }
            })
            return quizes;
        }

        let filteredQuizes = insertIterations(sortedAllQuizes, {total})
        console.log("qqqqq quiestions 3.5", filteredQuizes);
        setModalOpts({loading: true, quizes: []})
        setOpen(true)

        let dbQuizes = await getDBQuizes(filteredQuizes)
        console.log("qqqqq quiestions 4", dbQuizes);


        // function extractIterations () {
        //
        // }
        //


        // console.log("qqqqq quiestions 1", grouppedQuizes);


        //
        //  let vv = smartLoad(questions, opts)
        //  let visibleQuestions = vv.res;
        //
        //  // setOpen(true);
        //  let key = isExam ? 'exam' : 'train';
        //
        //
        //  let v = visibleQuestions.map(it => {
        //      return getSortedQuizesByQuestion(res, it, key, qSize)
        //  })
        //  let quizesPlain = _.sortBy(v.reduce((acc, it) => {
        //      return [...acc, ...it.quizes]
        //  }, []), sortFn(key)).splice(0, total)
        // //console.log("qqqqq quizes Plain 0", visibleQuestions.map(it => it._id), visibleQuestions.map(it => it[key]), key);
        // //console.log("qqqqq quizes Plain 1", vv, {visibleQuestions}, visibleQuestions.map(it => ({
        // //      name: it.name,
        // //      _id: it._id,
        // //      [key]: it[key]
        // //  })));
        // //console.log("qqqqq quizes Plain 2", quizesPlain.map(sortFn(key)), quizesPlain, key, v);
        //
        //  let dbQuizes = await getDBQuizes(quizesPlain)
        //  console.log("qqqqq VISIBLE QUSEITONS", {opts, dbQuizes, visibleQuestions, v, quizesPlain});
        //
        let autoInterview;

        if (isExam && dbQuizes?.length) {
            autoInterview = await createAutoInterview({
                quizes: dbQuizes.map(it => it?.item?._id),
                questions: dbQuizes.map(it => it?.opts?.question),
            })
            _.each(dbQuizes, (item, ind) => {
                item.opts = item.opts || {};
                item.opts.autoInterview = autoInterview._id
            })

            //console.log("qqqqq auto Interivew", autoInterview);
        }

        setModalOpts({loading: false, quizes: dbQuizes, isExam, autoInterview})

    }


    let onTrainFeedback = async (props) => {
        let {fb, hist, quizId} = props;
        console.log("qqqqq props", props);
        let dbQuizes = await getDBQuizes([{_id: quizId || hist?.quiz}])
        _.each(dbQuizes, (item, ind) => {
            item.opts = item.opts || {};
            item.opts.parentFB = fb._id;
        })
        setModalOpts({loading: false, quizes: dbQuizes, isExam: false})
        setOpen(true)

        //console.log("qqqqq db Quizes44444", dbQuizes);

    }


    let onTrainInterview = async (_id) => {
        //console.log("qqqqq it on train Interivew", _id);
        let dbQuizes = await getDBQuizes([{_id}])
        _.each(dbQuizes, (item, ind) => {
            item.opts = item.opts || {};
            item.opts.parentFB = fb._id;
        })
        setModalOpts({loading: false, quizes: dbQuizes, isExam: false})
        setOpen(true)

        //console.log("qqqqq db Quizes44444", dbQuizes);

    }

    let changeFb = (v) => {
        _.each(res.fb, (item, ind) => {
            if (item._id == v._id) {
                let vv = {...item, ...v};
                res.fb[ind] = vv;
                global.http.put("/feedback-history", vv).then(r => {
                    //console.log("qqqqq upDtedddddd", );
                })
            }
        })
        setRes({...res})
        return v;
    }

    let AutoInterviewWrap = (props) => {
        let _interview = props?.opts?.autoInterview || interview;
        return <AutoInterview interview={_interview}></AutoInterview>
    }

    smartLoad(questions, {
        total: 7,
        query: {train: 2, exam: 3},
        logs: true,
        shuffleResults: true, woRemoveEmpty: true
    })
    let totalStats = getTotalStats({res, history});

    interview = interview || (res.interviews || {})[0];
    fb = fb || (res.fb || {})[0];

    //console.log("qqqqq interview555", interview);
    return (
        <div style={{margin: "0"}} className={'courseWrap ' + (loading ? 'courseLoading' : '')}>
            <MyModal
                isOpen={interviewModal}
                onClose={() => {
                    setInterviewModal(false)
                    reloadAll();
                }}
                size={'lg'}>
                Результаты Интервью
                <AutoInterview interview={interview}
                               onClick={(_id) => {
                                   //console.log("qqqqq interview555 on Train", _id);
                                   clickQuestion({_id}, 'train')
                                   // smartClick(questions, {
                                   //     query: {train: 1}
                                   // })
                               }}
                ></AutoInterview>
            </MyModal>
            <MyModal
                isOpen={open}
                onClose={() => {
                    //console.log("qqqqq on Close!!!!!", );
                    setOpen(false)
                    reloadAll();
                }}
                size={'full'}>
                <TrainPageCourse
                    onResult={() => {
                        if (!modalOpts.autoInterview) {
                            setOpen(false)
                        }
                        if (modalOpts.autoInterview) {
                            //console.log("qqqqq ON RESULTTTTTTTTTT", modalOpts.autoInterview);
                            setInterviewModal(true)
                            setOpen(false)
                            setInterview(modalOpts.autoInterview)
                        }
                        reloadAll();

                    }}
                    Result={modalOpts.autoInterview ? AutoInterviewWrap : null}
                    onChange={(quizHistory) => {
                        console.log("qqqqq quiz histoyr", quizHistory);
                    }}
                    opts={modalOpts}
                />
            </MyModal>
            <div className="row">
                <TopStats
                    onClickExam={() => smartClick(questions, {
                        isExam: true,
                        total: 5,
                        // query: {
                        //     audio: 3,
                        //     code: 4,
                        //     total: 8,
                        // }
                    })}
                    onClickTrain={() => smartClick(questions, {
                        total: 3,
                        // query: {
                        //     audio: 3,
                        //     code: 4,
                        //     total: 8,
                        // }
                    })}
                    totalStats={totalStats}
                ></TopStats>

                <div className="col-sm-12"></div>

                <div className="col-sm-6">
                    <div className="card2 card3">
                        <Courses
                            res={res}
                            history={history}
                            onClick={clickCourse}
                            courses={courses}
                        ></Courses>
                    </div>
                    <div className="card2 card3 animChild">
                        <QuestionsList
                            questionsObj={questionsObj}
                            history={history}
                            onClick={clickQuestion}
                            questions={visibleQuestions}
                        ></QuestionsList>
                    </div>
                </div>
                <div className="col-sm-6">
                    <div className="card2 animChild">
                        <FeedbacksList
                            onClick={clickFeedback}
                            onTrain={onTrainFeedback}
                            onChangeFb={changeFb}
                            fb={fb}
                            res={res}
                        ></FeedbacksList>
                    </div>
                    <div>

                        <Interviews
                            res={res}
                            onTrain={onTrainInterview}
                            onClick={(interview) => {
                                //console.log("qqqqq nothing here", interview);
                                setInterviewModal(true)
                                setInterview(interview)
                            }}></Interviews>
                    </div>
                </div>
                <div className="col-sm-12">

                </div>

                {/*<div className="col-sm-12">*/}
                {/*    <div className="card2 w100">*/}
                {/*        <WorkSessions></WorkSessions>*/}
                {/*    </div>*/}
                {/*</div>*/}
                <div className="col-sm-12">
                    <div className="card2 w100">
                        <Statistics
                            res={res}
                        ></Statistics>
                    </div>
                </div>
            </div>
            {/*<div*/}
            {/*  className="afade coursePreview coursePreviewTitle"*/}
            {/*>*/}
            {/*  <strong className="tabsTitle">*/}
            {/*    Список доступных курсов ({courses.length}):*/}
            {/*  </strong>*/}
            {/*</div>*/}
            {/*<div*/}
            {/*  data-courses={(courses || []).length}*/}
            {/*  className="animChild "*/}
            {/*  style={{*/}
            {/*    display: "block",*/}
            {/*    gap: "10px",*/}
            {/*    textAlign: "center",*/}
            {/*  }}*/}
            {/*>*/}
            {/*  {(courses || []).map((it, ind) => {*/}
            {/*    let perc = getCoursePerc(it, history);*/}
            {/*    let hist = (history || {})[it._id] || {};*/}
            {/*    perc = perc || 0;*/}
            {/*    return (*/}
            {/*      <Link*/}
            {/*        to={"/courses/" + it._id}*/}
            {/*        key={ind}*/}
            {/*        className={"mainCont3 coursePreview"}*/}
            {/*      >*/}
            {/*        <div className="courseTitle">{it.name}</div>*/}
            {/*        <div>*/}
            {/*          <small>Кол-во модулей: {(hist.modules || []).length}</small>*/}
            {/*        </div>*/}
            {/*        <small>Процент изучения: {perc}%</small>*/}
            {/*        <Perc top={15} value={perc}></Perc>*/}
            {/*      </Link>*/}
            {/*    );*/}
            {/*  })}*/}
            {/*</div>*/}
        </div>
    );
}

export default Layout2;
