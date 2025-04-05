import React, {useState, useEffect} from 'react';
import CircularProgress2 from "./CircularProgress2";
import FeedbackReview from "../FeedbackReview";
import Button from "../../../libs/Button";
import Select from "../../../libs/Select";
import {getQuizAnyName} from "../../RunExam";
import {getTitleInfoName} from "../AutoInterview";

function Layout2(props) {
    //console.log('*........ ## ROOT RENDER', props);

    let [filter, setFilter] = useState({});
    let [items, setItems] = useState([]);
    let [stats, setStats] = useState({});

    useEffect(() => {
        // loadFeedbacks();
        // loadFeedbacksStats();

    }, [])

    let rate5Comment = (it) => {
        return 'Молодец, продолжай в том же духе!'
    }
    let getEqualComment = (it) => {
        return 'Оценка верная, но нужно еще поработать!'
    }
    let getNot5 = (it) => {
        return 'Нужно еще поработать над этим вопросом!'
    }

    let loadFeedbacksStats = () => {

    }
    let loadFeedbacks = () => {
        global.http.get("/my-feedback-history", {
            filter: {'stats.answerVSadmin': 'less'}
        }).then(r => {
            //console.log("qqqqq rrrrrrr", r);
            setItems(r.items)

        })
    }
    let onClickFb = (fb) => {
        myPlayer({src: ''})
        global.http.get('/quiz-history/' + fb.hist1, {_id: fb.hist1}).then(r => {
            console.log("qqqqq ifnnfofofofofof", r);
            myPlayer({user: r.user, hash: r.hash, text: r.recognition?.recognizedText})
        })
    }

    let getPercNewCount = () => {
        let wrongCount = 0;
        let openCount = 0;
        let time = 0;
        let cd = new Date().getTime();
        let count = (res.fb || []).length || 0;

        let timeCount = 0;


        _.each(res.fb, (item, ind) => {
            let {isOpen, isViewed, answerDetails = {}, stats = {}, adminDetails = {}, reviewDetails = {}} = item;


            if (adminDetails.rate != 5) {
                //console.log("qqqqq item", item);
                time += (reviewDetails?.rate == 5 ? reviewDetails?.cd || cd : cd) - adminDetails.cd
                //console.log("qqqqq time", time, new Date(reviewDetails.cd), new Date(cd));
                timeCount++;
            }

            if (isOpen) {
                openCount++;
            }


            if (stats?.answerVSadmin !== 'equal') {
                wrongCount++;
            }
            //
        })

        return {
            totalCount: count, openCount, perc: Math.round(100 * (count - wrongCount) / (count || 1)),
            time: Math.round((time / (timeCount || 1)))
        }

    }

    let {onClick, fb, onTrain, onChangeFb, res} = props;
    let {perc, totalCount, time, openCount} = getPercNewCount()
    // let v = useActionData();
    return <div>
        {!!openCount && <div>Кол-во не проработанных фидбеков: {openCount} из {totalCount}</div>}
        {!!totalCount && !openCount && <div>Все фидбеки проработаны - ты молодец!</div>}
        <div>% соответствия оценок: {perc}%;
            <div className="ib mlcircle">
                <CircularProgress2
                    title={""} value={perc} size={20}></CircularProgress2>
            </div>
        </div>
        {!!time && <div>Время обработки ОС: {Math.round(time / (60 * 1000)) || 'менее 1'}мин</div>}
        {/*<Select items={['new', 'open', 'all']}></Select>*/}
        <hr/>

        <div className="row">
            <div className="col-sm-12">
                <div className={'fbList fbList2 animChild qlist'}>
                    {/*{(items || []).map((it, ind) => {*/}
                    {/*    return (<div key={ind}>*/}
                    {/*        aaaa*/}
                    {/*    </div>)*/}
                    {/*})}*/}
                    {!totalCount && <div>
                        Здесь вы будете видеть ревью своей работы куратором
                    </div>}


                    {(res.fb || []).map((it, ind) => {
                        let {
                            odb, hist1, isAdmin, stats = {},
                            name, _id, isOpen, isViewed,
                            answerDetails = {}, adminDetails = {}, reviewDetails = {}
                        } = it || {};
                        answerDetails = answerDetails || {}

                        let count = (it.parents || []).length
                        return (<div key={ind}
                                     onMouseEnter={() => {
                                         //console.log("qqqqq change isViewed",);
                                     }}
                        >
                            <div className={'pull-right'}>
                                {!isOpen && !isViewed && <Button
                                    color={0}
                                    size={'xs'} onClick={(cb) => {
                                    cb && cb();
                                    onChangeFb({_id: it._id, isViewed: true})
                                    //console.log("qqqqq Feedback Thanks", it);

                                }}>Спасибо за фидбек!</Button>}
                                <Button
                                    color={isOpen ? 0 : 4}
                                    size={'xs'} onClick={(cb) => {
                                    cb && cb();
                                    //console.log("qqqqq itttttt", it);
                                    onTrain && onTrain({fb: it, quizId: it.quiz})
                                    onChangeFb({_id: it._id, isViewed: true})
                                }}>Тренеровать{!isOpen ? ' еще' : ''}</Button>
                            </div>

                            <div onClick={() => {
                                onClickFb(it)
                                //console.log("qqqqq ittttt on click", it);
                            }}>
                                <div style={{marginBottom: '5px'}}>
                                    {!!count && adminDetails?.rate != 5 &&
                                        <div className="label label-danger">ПОВТОРНЫЙ !!</div>}
                                    {/*{!isOpen && <div className="label label-success">ok</div>}*/}
                                    {isOpen && <div className="label label-danger">На проработке</div>}
                                    {!isViewed && <div className="label label-success">Новый</div>}
                                    <div className="label label-default">#{_id}</div>
                                </div>

                                <div className={'ellipse w100 pointer'}>
                                    <div className="fa fa-play o3" style={{marginRight: '5px'}}></div>
                                    {/*{name || '-'}*/}
                                    {getTitleInfoName(it)}
                                    {/*{getQuizAnyName(it)}*/}
                                </div>

                                <div className="pointer" style={{marginBottom: '5px'}}>
                                    <small className="label2 label-default2">Старт
                                        оценка: {answerDetails.rate || '-'}</small>
                                    <small className="label2 label-default2">Оценка
                                        куратора: {adminDetails.rate || '-'}</small>
                                    <small className="label2 label-default2">Ревью: {reviewDetails.rate || '-'}</small>
                                </div>
                                <strong>
                                    <small>

                                        {adminDetails?.growComment && <><Comment></Comment>{adminDetails?.growComment}</>}
                                        {!adminDetails?.growComment && reviewDetails?.rate != 5 && (adminDetails?.rate == answerDetails?.rate) && adminDetails?.rate != 5 && <><Comment></Comment>{getEqualComment(it)}</>}
                                        {!adminDetails?.growComment && reviewDetails?.rate != 5 && (adminDetails?.rate != answerDetails?.rate) && adminDetails?.rate != 5 && <><Comment></Comment>{getNot5(it)}</>}
                                        {!adminDetails?.growComment && adminDetails?.rate == 5 && <><Comment></Comment>{rate5Comment(it)}</>}
                                    </small>
                                </strong>
                            </div>
                            <hr/>
                        </div>)
                    })}
                </div>
            </div>
            {/*<div className="col-sm-8">*/}
            {/*  <FeedbackReview fb={fb} onTrain={(v) => {*/}
            {/*   //console.log("qqqqq on Train", v);*/}
            {/*    onTrain(v)*/}
            {/*  }}></FeedbackReview>*/}
            {/*</div>*/}
        </div>

    </div>
}

function Comment () {
    return <span
        className="fa fa-comment o5 mr-5" style={{marginTop: '-3px'}}></span>
}



export default Layout2
