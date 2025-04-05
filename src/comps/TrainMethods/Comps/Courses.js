import Button from "../../../libs/Button";
import {Link, Outlet} from "react-router-dom";
import React, {useState} from 'react';
import {getCoursePerc, getPercByIds} from "./mainMethods";
import CircularProgress2 from "./CircularProgress2";

function Layout2(props) {

    let {courses, history, onClick, res} = props;

    return <div>
        <div
            data-courses={(courses || []).length}
            className="animChild coursesItems"
        >
            <div>
                Курсы ({courses.length})
            </div>

            <hr/>
            {(courses || []).map((it, ind) => {
                let perc = getCoursePerc(it, history);
                let hist = (history || {})[it._id] || {};

                let {train, exam} = getPercByIds(hist.questions, res)
                perc = perc || 0;
                return (
                    <div
                        key={ind}
                        className={"fbList"}
                        // onClick={(e) => {
                        //     onClick && onClick(hist.questions)
                        //
                        // }}
                    >
                        <Link
                            to={"/courses/" + it._id}
                        >
                            <div className="text-left ellipse w100 pointer"
                                 style={{padding: '6px 0'}}
                            >
                                <div className="ib trIcons">

                                    <div className="fa fa-code"
                                         onClick={(e) => {
                                            //console.log("qqqqq hist4444", hist );
                                             onClick && onClick(hist.questions)
                                             return m.prevent(e)
                                         }}
                                    ></div>
                                </div>
                                <div className="ib coursesProgress"
                                     style={{width: '60px', marginRight: '7px'}}>
                                    <div className="ib" style={{width: '33%'}}>
                                        <CircularProgress2
                                            zoom={.7}
                                            title={"Теория"} value={perc} size={20}></CircularProgress2>
                                    </div>
                                    <div className="ib" style={{width: '33%'}}>
                                        <CircularProgress2
                                            zoom={.7}
                                            title={"Практ"} value={train} size={20}></CircularProgress2>
                                    </div>
                                    <div className="ib" style={{width: '33%'}}>
                                        <CircularProgress2
                                            zoom={.7}
                                            title={"Экзамен"} value={exam} size={20}></CircularProgress2>
                                    </div>
                                </div>
                                <div className="courseTitle ib" style={{}}>{it.name}</div>
                                {/*<div className="icons">*/}
                                {/*    <Button size={'xs'} color={4}>*/}
                                {/*    </Button>*/}
                                {/*    <Button size={'xs'} color={4}>*/}

                                {/*    </Button>*/}
                                {/*</div>*/}
                                {/*<small>Кол-во модулей: {(hist.modules || []).length}</small>*/}
                            </div>
                        </Link>
                    </div>
                );
            })}
        </div>
    </div>
}

export default Layout2


