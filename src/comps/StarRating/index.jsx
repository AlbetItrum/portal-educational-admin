import React, { useState, useEffect } from "react";
import "./style.css";
import Smart from "../../libs/Smart";
import MyModal from "../../libs/MyModal";
import { generateSuggestion } from "../Suggest/SuggestionItem";


export const StarRating = (props) => {
    const [hover, setHover] = useState(0);
    const [history, setHistory] = useState({});
    const [avg, setAvg] = useState({});
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    let { question } = props || {};
    let questionId = (question || {})._id;
    useEffect(() => {
        question && question._id && global.http.get('/get-rating', { questionId }).then((r) => {
            setHistory({ question: questionId, ...r || {} })
            setLoading(false)
            setAvg(question.rating || {})
        })
    }, [(question || {})._id])

    let ratingValue = (history.rating || {}).score;

    function setHistoryDB(_history) {
        setHistory({ ..._history })
        global.http.post("/set-rating", _history).then(r => {
            let { avg } = r;
            setAvg(avg)
            question.rating = avg;
           //console.log("update AVG values", r)
        })
    }
    function getVotesLabel(votes) {
        let label = 'голос';

        if (votes === 0 || votes >= 5 && votes <= 20) {
            label = 'голосов';
        } else if (votes % 10 === 1) {
            label = 'голос';
        } else if (votes % 10 >= 2 && votes % 10 <= 4) {
            label = 'голоса';
        } else {
            label = 'голосов';
        }

        return `(${votes} ${label})`;
    }

    if (loading) {
        return <></>
    }

    return (
        <div className="star-rating ">
            {/* {[...Array(5)].map((_, i) => (
                <div
                    key={`star-rating-btn_${i + 1}`}
                    className={'ib ' + (i + 1 <= (hover || ratingValue) ? "on" : "off")}
                    onClick={() => {
                        setHistoryDB({...history || {}, rating: {score: i + 1, cd: new Date().getTime()}});
                    }}
                    onMouseEnter={() => setHover(i + 1)}
                    onMouseLeave={() => setHover(ratingValue)}
                >
                    <span className="star">&#9733;</span>
                </div>
            ))} */}
            <div className="ratingList">
                <div className={"ib " + (ratingValue > 3 ? 'liked' : '')}
                    onClick={() => {
                        setHistoryDB({ ...history || {}, rating: {...(history || {}).rating || {},  score: 5, cd: new Date().getTime() } });
                    }}>Нравится</div>
                <div className={"ib " + (ratingValue <= 3 ? 'liked' : '')} onClick={() => {
                    setHistoryDB({ ...history || {}, rating: {...(history || {}).rating || {}, score: 1, cd: new Date().getTime() } });
                }}>Не нравится</div>

                {/* {!ratingValue && <small>Оцените топик</small>} */}

                <div className="ib">{<small>
                    {/* Средняя {(avg.avgScore || 0).toFixed(1)} {getVotesLabel(avg.count)} */}
                    {/* <div></div> */}
                    <a onClick={() => {
                        setOpen(true)
                    }}>Что улучшить?</a>
                    <MyModal
                        isOpen={open}
                        onClose={() => setOpen(false)}
                    >
                        <div style={{ 'marginTop': '10px' }}>
                            <div>Твой фидбек помогает всем обучаться быстрее, спасибо!!</div>
                            <hr />

                            <small style={{ marginBottom: '10px', display: 'inline-block' }}>Выбери над чем стоит
                                поработать в первую очередь</small>
                            <Smart
                                obj={history.rating}
                                items={[{
                                    size: 12, 
                                    type: 'select',
                                    key: 'type',
                                    items: [
                                      {name: 'Выберите из списка', value: ''}, { name: 'Ответ не понятен', value: 'unclear_question' }, 
                                      { value: 'not_deep_answer', name: 'Не глубокий ответ' }, { value: 'not_actual_question', name: 'Вопрос не актуален' }]
                                },
                                {
                                    size: 12,
                                    defClass: 'mt10',
                                    childs: [{
                                        name: 'Детальный комментарий (опционально)',
                                        minRows: 1,
                                        key: 'desc',
                                        size: 12,
                                        type: 'textarea'
                                    }]
                                }]}
                                onChange={(rating) => {
                                    rating.cd = new Date().getTime();
                                    setHistory({ ...history, rating })
                                }}
                            >

                            </Smart>
                            <hr />
                            <button className={'btn btn-md btn-primary'}
                                onClick={() => {
                                    setOpen(false)
                                    setHistoryDB(history)
                                }}
                            >Отправить</button>
                        </div>

                    </MyModal>

                </small>}</div>
                <div className="ib">
                    <small>
                        <a onClick={() => {
                            generateSuggestion(questionId)
                        }}>
                            <i className="fa fa-pencil" style={{ marginRight: '10px' }}></i>
                            Предложить свой ответ
                        </a>
                    </small>

                </div>
            </div>

        </div>
    );
};
