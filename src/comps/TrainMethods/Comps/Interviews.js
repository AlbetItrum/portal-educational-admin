import React, {useState} from 'react';
import Button from "../../../libs/Button";
import m from "../../../libs/m/m";
import './Interviews.css'

// import AutoInterview from "../AutoInterview";

function Layout2(props) {
    //console.log('*........ ## ROOT RENDER', props);

    let [interview, setInterview] = useState(null)

    let {res, onClick, onTrain} = props;
    interview = interview || (res.interviews || [])[0];

    let getCl = (value, prefix) => {
        value = +value;
        let postfix = value == 5 ? 'Ok' : !value ? 'Grey' : value < 4 ? 'Err' : 'Mid'
        return ' ' + prefix + postfix
    }
    return <div>
        <div className="card2 animChild">
            <div>Мои Тренир. Интервью</div>
            {/*<Button color={4} size={'xs'}>Тренировать проблемные вопросы</Button>*/}
            <hr/>
            <div className="row">
                <div className="col-sm-12">
                    <div className={'fbList animChild pointer hoverChild'}>

                        {!(res.interviews || []).length && <>
                            Здесь будет список ваших треноровочных интервью
                        </>}
                        {(res.interviews || []).map((it, ind) => {
                            return (<div key={ind} onClick={() => {
                                onClick && onClick(it)
                                setInterview(it)
                            }}>
                                {m.date_time_short(it.cd)}

                                {(it.quizes || []).map((it2, ind) => {
                                    let st = (it.info || {})[it2] || {}
                                    console.log("qqqqq stttttt", st, it, it2);
                                    return (<div key={ind}
                                                 className={'ib'} style={{marginTop: '3px'}}>
                                        <div className={'interviewIndicator '
                                            + (st?.adminRate ? 'adminRated ' : ' ')
                                            + getCl(st?.adminRate || st?.rate || 1, 'main')
                                            // + getCl(st?.adminRate, 'admin')
                                        }>
                                        </div>
                                        {/*<div className={'interviewIndicator '*/}
                                        {/*    // + getCl(st?.rate || 1, 'main')*/}
                                        {/*    + getCl(st?.adminRate, 'main')*/}
                                        {/*}>*/}

                                        {/*</div>*/}
                                    </div>)
                                })}


                            </div>)
                        })}
                    </div>

                </div>
                {/*<div className="col-sm-8">*/}
                {/*  <AutoInterview interview={interview}*/}
                {/*                 onClick={onTrain}*/}
                {/*  ></AutoInterview>*/}
                {/*</div>*/}
            </div>
        </div>
    </div>
}

export default Layout2
