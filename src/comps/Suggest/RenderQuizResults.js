import React, {useState, useEffect} from 'react';
import _ from 'underscore';

import {
    Link, Outlet
} from "react-router-dom";
import QuizPreview from "./QuizPreview";
import {getQuizName} from "../RunExam";

function splitIntoChunks(arr, chunkSize) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
        chunks.push(arr.slice(i, i + chunkSize));
    }
    return chunks;
}


function Layout2(props) {
    let [selectedInd, setSelectedInd] = useState(0)
    let [examHist, setExamHist] = useState(getHist());
    let [userRates, setUserRates] = useState(getExamRates());

    function getHist() {
        let history = props.history;
        return ((history['-1'] || {}).quizHistory || {}).history || {}
    }

    function getExamRates() {
        return (props.exam || {}).userRates || {}
    }

    useEffect(() => {
        setExamHist(getHist())
        setUserRates(getExamRates())
    }, [props.history]);

    let {exam} = props;

    let chunkSize = 4;

    function onUpdate(opts) {
        let quizId = opts.quiz;

        userRates[`quiz_` + quizId] = {...userRates[`quiz_` + quizId] || {}, ...opts};
        examHist[quizId] = {...examHist[quizId] || {}, ...opts}
        setExamHist({...examHist})
        setUserRates({...userRates})
        let hist = (examHist[quizId] || {});
        global.http.get('/put-rate', {exam: exam._id, hash: hist.hash, ...userRates[`quiz_` + quizId]})

    }

    function isAudioFn(quiz) {
        return /audio|code/gi.test(quiz?.answerType || '')
    }

    function isShowCodeRateFn(quiz) {
        return quiz?.answerType === 'code'
    }

    function getUserRates(quiz) {
        let {rate, codeRate} = (userRates || {})[`quiz_` + quiz?._id] || {}
        return {rate, codeRate}
    }


    let quiz = (exam.quizQuestionsPlain || [])[selectedInd]


    let {rate, codeRate} = getUserRates(quiz)
    let isAudio = isAudioFn(quiz)
    let showCodeRate = isShowCodeRateFn(quiz)
    console.log("qqqqq history44444", examHist);
    return <>
        {!!exam && !!exam.quizQuestionsPlain && !!exam.quizQuestionsPlain.length && <div className={'quizResults'}>
            {/* История тестов. Выполнено правильно {(exam.scoreDetails || {}).quizPerc || 0}% */}
            {/* <hr/> */}
            <hr/>

            {/*{splitIntoChunks(exam.quizQuestionsPlain || [], chunkSize).map((items, ind) => {*/}
            {/*    let quiz = items[selectedInd]*/}

            {/*    return <div className={'row'}>*/}
            {/*        <div className="col-sm-12" style={{marginTop: '10px'}}></div>*/}
                    <div className="col-sm-6">
                        {(exam.quizQuestionsPlain || []).map((it, ind) => {
                            let quiz = it;

                            let hist = examHist[it._id] || {}
                            // let chosen = (examHist[quiz._id] || {}).chosen;
                            let {rate, codeRate} = getUserRates(quiz)
                            let showCodeRate = isShowCodeRateFn(quiz);
                            let isAudio = isAudioFn(quiz);
                            let isError = () => {
                                return isAudio && hist?.hash && !rate;
                            }
                            console.log("qqqqq it", hist);
                            return (<div
                                className={'pointer ' + (ind == selectedInd ? 'activeList' : '')}
                                style={{padding: '10px'}}
                                key={ind} onClick={() => {
                                    myPlayer(
                                        hist?.hash
                                            ? {path: `/${exam.user}/${hist?.hash}.wav`}
                                            : {src: ''}
                                    )
                                setSelectedInd(ind)
                            }}>
                                <div>
                                    <small>
                                        {isAudio && rate && <div className="ib mr-10">
                                            Оценка аудио: {rate}
                                        </div>}
                                        {showCodeRate && codeRate && <div className="ib">
                                            Оценка кода: {codeRate}
                                        </div>}
                                    </small>
                                </div>
                                <strong className={'ellipse w100'}>
                                    {isError() && <span className="label label-danger mr-5">Оцените ответ</span>}
                                    {(getQuizName(it) || it.specilTitle || it.specialName || '--')}</strong>


                            </div>)
                        })}


                    </div>
                    <div className="col-sm-6">
                        <div
                            style={{padding: '20px'}}
                            // className={' ' + (_.size((examHist[quiz._id] || {}).chosen) ? 'answered' : 'notanswered')}
                        >
                            {isAudio && <>

                                <div>
                                    <small>Оцените ваш аудио ответ</small>
                                </div>
                                <div>
                                    {([1, 2, 3, 4, 5] || []).map((it, ind) => {
                                        return (
                                            <span key={ind} className={'shortTag ' + (rate == it ? 'selected' : '')}
                                                  onClick={() => {
                                                      onUpdate({quiz: quiz._id, rate: it})
                                                  }}>
                        {it}
                    </span>)
                                    })}
                                </div>
                            </>}
                            {showCodeRate && <>

                                <div>
                                    <small>Оцените ваш код</small>

                                </div>
                                <div>
                                    {([1, 2, 3, 4, 5] || []).map((it, ind) => {
                                        return (
                                            <span key={ind}
                                                  className={'shortTag ' + (codeRate == it ? 'selected' : '')}
                                                  onClick={() => {
                                                      onUpdate({quiz: quiz._id, codeRate: it})
                                                  }}>
                        {it}
                    </span>)
                                    })}
                                </div>
                            </>}
                            {isAudio && <div>
                                <hr/>
                            </div>}
                            <QuizPreview quiz={quiz}
                                         skipBottomOpenText={true}
                                         exam={exam}
                                         history={{...(examHist || {})[quiz?._id], isSubmit: true,}}
                                         onSubmit={(chosen) => {
                                         }}
                            ></QuizPreview>
                        </div>
                    </div>
                    {/*{(items || []).map((quiz, ind) => {*/}
                    {/*    return (<div key={ind}*/}
                    {/*                 style={{padding: '20px'}}*/}
                    {/*                 className={'col-sm-' + (12 / chunkSize) + ' ' + (_.size((examHist[quiz._id] || {}).chosen) ? 'answered' : 'notanswered')}>*/}
                    {/*        <QuizPreview quiz={quiz}*/}
                    {/*                     skipBottomOpenText={true}*/}
                    {/*                     history={{...examHist[quiz._id], isSubmit: true,}}*/}
                    {/*                     onSubmit={(chosen) => {*/}
                    {/*                     }}*/}
                    {/*        ></QuizPreview>*/}
                    {/*    </div>)*/}
                    {/*})}*/}
            {/*    </div>*/}
            {/*})}*/}
        </div>}
    </>
}

export default Layout2
