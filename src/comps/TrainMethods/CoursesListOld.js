import React, { useEffect, useState } from "react";
import _ from "underscore";
import "./CoursesList.css";
import { Link, Outlet } from "react-router-dom";
import Perc from "./../Suggest/Perc";
import Button from "libs/Button";

function Layout2(props) {
    let [courses, setCourses] = useState([]);
    let [history, setHistory] = useState({});
    console.log("*........ ## ROOT RENDER", props);

    function getCoursePerc(course, history) {
        let hist = (history || {})[course._id];
        let { qHistory = {}, mHistory = {} } = hist || {};
        let total = 0;
        let goodCount = 0;
        console.log("qqqqq course333333333", hist);

        let activeInd = 0;
        let isBad = false;
        _.each(hist.modules, (item, ind) => {
            total++;
            if (((mHistory || {})[item.module] || {}).status === "ok") {
                goodCount++;
            }
            _.each(item.questions, (qId, ind) => {
                total++;

                if (!isBad && hist && (qHistory[qId] || {}).status === "ok") {
                    activeInd = ind + 1;
                    goodCount++;
                } else {
                    isBad = true;
                }
            });

            // let hist = history[item.module]
            // console.log("qqqqq hist", hist, item.module, history);
        });
        console.log("qqqqq goodCount", mHistory, hist, goodCount, total);
        return Math.round((100 * goodCount) / total);
    }

    useEffect(() => {
        global.http.get("/load-my-courses").then(({ courses, userCourses }) => {
            setCourses(courses);
            setHistory(
                userCourses.reduce((acc, it) => ({ ...acc, [it.course]: it }), {})
            );
        });
    }, []);
    // let v = useActionData();
    console.log("qqqqq courses", courses, history);
    return (
        <div style={{ margin: "0 -17px" }}>
            <div
                className="afade coursePreview coursePreviewTitle"
            >
                <strong className="tabsTitle">
                    Список доступных курсов ({courses.length}):
                </strong>
            </div>
            <div

                data-courses={(courses || []).length}
                className="animChild "
                style={{
                    display: "block",
                    gap: "10px",
                    textAlign: "center",
                }}
            >
                {(courses || []).map((it, ind) => {
                    let perc = getCoursePerc(it, history);
                    let hist = (history || {})[it._id] || {};
                    perc = perc || 0;
                    return (
                        <Link
                            to={"/courses/" + it._id}
                            key={ind}
                            className={"mainCont3 coursePreview"}
                        >
                            <div className="courseTitle">{it.name}</div>
                            <div>
                                <small>Кол-во модулей: {(hist.modules || []).length}</small>
                            </div>
                            <small>Процент изучения: {perc}%</small>
                            <Perc top={15} value={perc}></Perc>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

export default Layout2;

