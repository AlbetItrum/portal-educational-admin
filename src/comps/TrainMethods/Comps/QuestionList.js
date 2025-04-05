import React, {useState} from 'react';
import CircularProgress2 from "./CircularProgress2";
import Button from "../../../libs/Button";
import Select from "../../../libs/Select";


export function getSortedQuestions (questions, key) {
    let keys = {
        auto: 'train',
        train: 'train',
        exam: 'exam',
        lastExam: 'lastExam',
        lastTrain: 'lastTrain',

    }
    key = keys[key] || key || '';

    let fns = {
        notTouched(it){
            return it.count;
        }
    }
    return _.sortBy(questions, it => {
        if (fns[key]) {
            return fns[key](it)
        }
        return it[key] || 0;
    })

}

export function smartLoad(questions, opts) {
    opts = opts || {}
    let queryOpts = opts.query;
    let {total, logs, shuffleResults, woRemoveEmpty} = opts;

    if (!woRemoveEmpty) {
        questions = questions.filter(it => it.isRead)
    }

    logs && console.log("qqqqq smart load", questions, opts, queryOpts);
    let q = {};
    let res = [];
    let resObj = {};
    let resByKeys = {};

    _.each(queryOpts, (item, key) => {
        q[key] = getSortedQuestions(questions, key)
    })

    let defKey = 'exam'
    q[defKey] = q[defKey] || getSortedQuestions(questions, defKey)

    function tryPush (size, key) {
        if (size < 1) {
            return []
        }
        let arr = [];
        let resSize = 0;
        logs && console.log("qqqqq smart load size", size);
        _.each(q[key], (item, ind) => {
            let _id = item._id;
            if (!resObj[_id] && resSize < size) {
                resObj[_id] = true;
                resSize++;
                res.push(item);
                arr.push(item);
            }
        })
        return arr;
    }

    _.each(queryOpts, (item, key) => {
        let size = item;
        resByKeys[key] = tryPush(size, key)
    })

    resByKeys.default = tryPush(total - res.length, defKey)
    logs && console.log("qqqqq smart load 22", {q, resByKeys, resObj, res});
    logs && console.log("qqqqq smart load 33", res, {shuffleResults});
    return {
        res: shuffleResults ? _.shuffle(res) : res,
        resByKeys, resObj, q,
        originalQuestions: questions, opts
    };
}

function QuestionsList(props) {
   //console.log('*........ ## ROOT RENDER quiestiosnttnsttsntn', props);


    let [sort, setSort] = useState('train');

    let {questionsObj, questions, onClick} = props;

    let _questions = getSortedQuestions(questions, sort).splice(0, 50)
    // let v = useActionData();
    return <div>
        <div className="pr">
            {/*<div className="ib">*/}
            {/*    <small>Сорт: </small>*/}
            {/*</div>*/}
            <div className="ib">
                <Select
                    value={sort}
                    items={[
                        {name: 'Cортировка', value: 'auto'},
                        {name: 'Тренировка %', value: 'train'},
                        {name: 'Экзамен %', value: 'exam'},
                        {name: 'Тренировка дата', value: 'lastTrain'},
                        {name: 'Экзамен дата', value: 'lastExam'},
                    ]}
                    onChange={(v) => {
                       //console.log("qqqqq vvvv", v);
                        setSort(v)
                    }}
                ></Select>
            </div>
        </div>
        <div>
            Вопросы на повторение
        </div>
        <hr/>
        <div className={'fbList animChild'}>
            {(_questions || []).map((v, ind) => {
                let _id = v._id;
                return (<div key={ind} className={'w100 rel qlist'}
                             onClick={() => onClick && onClick(v)}
                             style={{width: '100%'}}>
                    <div className="ib w100 ellipse pointer">
                        <div className="ib coursesProgress "
                             style={{width: '40px', marginRight: '7px'}}>
                            <div className="ib" style={{width: '50%'}}>
                                <CircularProgress2
                                    zoom={.7}
                                    title={"Практ"} value={v.train} size={20}></CircularProgress2>

                            </div>
                            <div className="ib" style={{width: '50%'}}>
                                <CircularProgress2
                                    zoom={.7}
                                    title={"Экзамен"} value={v.exam} size={20}></CircularProgress2>
                            </div>

                        </div>
                        {v.title}
                    </div>
                </div>)
            })}
        </div>
    </div>
}

export default QuestionsList
