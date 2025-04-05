import React, { useEffect, useState } from "react";
import _ from "underscore";

import { Link, Outlet } from "react-router-dom";
import CustomStorage from "./CustomStorage";
import PreviewCourseModule from "./PreviewCourseModule";

function CourseDetails(props) {
  let [data, setData] = useState({});
  let [loading, setLoading] = useState(false);

  let [qHistory, setQHistory] = useState({});
  let [mHistory, setMHistory] = useState({});
  let [dbQuestionsObj, setDBQuestionsObj] = useState({});
  let [selectedModuleInd, setSelectedModuleInd] = useState(0);
  let [selectedBlockInd, setSelectedBlockInd] = useState(0);
  let [open, setOpen] = useState(true);

  let [activeInd, setActiveInd] = useState(0);
  let isAdmin = false;

  function getActiveInd(course, mHistory) {
   //console.log("coursesese", course, mHistory);
    let isBad = false;
    _.each(course.modules, (item, ind) => {
      let hist = mHistory[item.module];
     //console.log("hhhhhhhhhhh", mHistory);
      if (!isBad && hist && hist.status === "ok") {
        activeInd = ind + 1;
      } else {
        isBad = true;
      }
    });
    return activeInd;
  }

  useEffect(() => {
    // console.log("qqqqq rrrrrrr4444444444444 1.0");
    global.http
      .get("/get-my-course-details", { _id: CustomStorage.getId() })
      .then((r) => {
        // console.log("qqqqq rrrrrrr4444444444444 2.0");

        if (r.error) {
          return alert(r.msg);
        }
        let { courseUser, course, dbQuestions } = r;
        let { mHistory, qHistory } = courseUser || {};
        mHistory ??= {};
        qHistory ??= {};
        let { modules = [] } = course;
        let dbQuestionsObj = dbQuestions.reduce(
          (acc, it) => ({ ...acc, [it._id]: it }),
          {}
        );
        let activeInd = Math.min(
          getActiveInd(courseUser, mHistory),
          courseUser.modules.length - 1
        );
        setData(courseUser);
        setQHistory(qHistory);
        setMHistory(mHistory);
        setDBQuestionsObj(dbQuestionsObj);

        // console.log("qqqqq rrrrrrr4444444444444 3.0");
        // console.log(
        //   "rrrrrrr4444444444444 4.0",
        //   mHistory,
        //   activeInd,
        //   { courseUser },
        //   dbQuestionsObj
        // );
        setActiveInd(activeInd);
        setSelectedModuleInd(Math.min(activeInd, course.modules.length - 1));
      });
  }, []);

  function isOkFn(ind) {
    return isAdmin || ind <= activeInd;
  }

  let selectedModule = (data.modules || [])[selectedModuleInd] || {};
  let moduleId = (selectedModule || {}).module;
  mHistory ??= {};
  let hist = mHistory[moduleId] || {};
  let isOk = isOkFn(selectedModuleInd);
  let dbQuestions = ((selectedModule || {}).questions || []).map(
    (it) => dbQuestionsObj[it]
  );

  function getActiveQId() {
    let activeQInd = 0;
    let isBad;

    let questions = dbQuestions;
    _.each(questions || [], ({ _id }, ind) => {
      let status = ((qHistory || {})[_id] || {}).status;
      if (status !== "ok") {
        isBad = true;
      }
      if (!isBad) {
        activeQInd = ind + 1;
      }
    });
    return activeQInd;
  }

  function isActiveOk(ind) {
    // return true;
    let questions = dbQuestions;
    if (isAdmin) {
      return true;
    }
    if (ind == -1) {
      return (
        activeQInd >= questions.length - 1 &&
        (
          qHistory[
            (questions[questions.length - 1] || {})._id || "_id_not_found"
          ] || {}
        ).status == "ok"
      );
    }
    return activeQInd >= ind;
  }

  qHistory ??= {};
  let activeQInd = getActiveQId();

  let Comp = (
    <div className="cmModulesList">
      {(data.modules || []).map((module, ind) => {
        let isOk = isOkFn(ind);

        // let selectedBlockInd = 0

        let isActive = selectedModuleInd == ind;
        let questions = dbQuestions;
       //console.log("module", module);
        return (
          <div
            key={ind}
            className={
              "moduleSelector " +
              (isOk && open ? "isOk " : "isNotOk ") +
              (isActive  ? "selectedModule " : "") +
              (ind <= activeInd ? "opened" : "closed")
            }
           
          >
            <div
              className="moduleTitle"
              onClick={(e) => {
               //console.log("qqqqq open module", ind, selectedModuleInd);
                if (selectedModuleInd != ind) {
                  setSelectedModuleInd(ind);
                  setSelectedBlockInd(getCurrentInd());
                  setLoading(true);
                  setOpen(true)
                  setTimeout(() => {
                    setLoading(false);
                  }, 100);
                } else {
                  setOpen(!open)
                }


                e.preventDefault();
                e.stopPropagation();
                return null;
              }}
            >
              {!isOk && <div className="fa fa-lock"></div>}
              {isOk && activeInd !== ind && <div className="fa fa-check"></div>}
              {isOk && activeInd === ind && <div className="fa fa-check"></div>}
              {ind + 1}. {isOk ? module.name : "Модуль " + (ind + 1)}
            </div>
            {isOk && isActive && open && (
              <>
                <div className="cmMainCont scroll550">
                  {/* {selectedBlockInd} */}
                  <div className={"blocksWrap animChild"}>
                    {(questions || []).map(
                      ({ title, name, useCase, _id, facts }, ind) => {
                        let isOk = isActiveOk(ind);
                        return (
                          <a
                            key={_id + "_" + ind}
                            className={
                              "listBlockCh " +
                              (selectedBlockInd === ind ? "activeBlock" : "")
                            }
                            style={{ display: "block" }}
                            onClick={() => {
                              // scrollToView("#block-" + ind)
                              onSelectInd(ind);
                            }}
                          >
                            <>
                              {!isOk && (
                                <>
                                  <i className={"fa fa-lock"}></i> Топик #
                                  {ind + 1}
                                </>
                              )}
                              {isOk && (
                                <>
                                  {title || CustomStorage.pubName(name) || ""}
                                </>
                              )}
                            </>
                          </a>
                        );
                      }
                    )}
                    {
                      <>
                        <a
                          className={
                            "listBlockCh " +
                            (selectedBlockInd === -1 ? "activeBlock" : "")
                          }
                          onClick={() => {
                            onSelectInd(-1);
                          }}
                        >
                          <>
                            {!isActiveOk(-1) && (
                              <i className={"fa fa-lock"}></i>
                            )}{" "}
                            Закрепление информации
                          </>
                        </a>
                      </>
                    }
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
  window.onRenderLeftMenu && window.onRenderLeftMenu(Comp);
  let isActive = isActiveOk(selectedBlockInd);
  let leng = ((selectedModule || {}).questions || []).length;

  function onOpenNext() {
    setSelectedModuleInd((selectedModuleInd + 1) % data.modules.length);
  }
  function onOpenNextQuestion(delta = 1) {
    let ind = (selectedBlockInd + delta + leng) % leng;
    if (delta > 0 && ind == 0) {
      ind = -1;
    }
    onSelectInd(ind);
    // setLoading(true)
    // setSelectedBlockInd(ind)
    // setTimeout(() => {
    //     setLoading(false)
    // }, 10)
  }

  function onSelectInd(ind) {
    setLoading(true);
    setSelectedBlockInd(ind);
    setTimeout(() => {
      setLoading(false);
    }, 100);
  }
  function getCurrentInd() {
    return 0;
  }
  // let v = useActionData();
 //console.log(
 //    "qqq quizExamSize REND WRAP: qqqqq selectedModule",
 //    selectedBlockInd,
 //    selectedModuleInd
 //  );
  return (
    <div className={"cmModulesWrap"}>
      {/* {leng} */}
      {moduleId && selectedModule && selectedModule._id && (
        <div className="cmModulesCont">
          {isOk && (
            <PreviewCourseModule
              onChangeInd={(delta) => {
                onOpenNextQuestion(delta);
              }}
              selectedBlockInd={selectedBlockInd}
              isActive={{ status: isActive }}
              loading={loading}
              selectedBlock={
                dbQuestionsObj[
                  data.modules[selectedModuleInd].questions[selectedBlockInd]
                ]
              }
              qHistory={qHistory || {}}
              mHistory={mHistory || {}}
              questions={dbQuestions}
              courseUserId={data._id}
              isAdmin={isAdmin}
              isLastModule={
                selectedModuleInd === ((data || {}).modules || []).length - 1
              }
              moduleId={selectedModule.module}
              onChangeQHistory={(r) => {
               //console.log("qqqqq qhistoyr before", qHistory);
                qHistory ??= {};
                qHistory = { ...qHistory, ...r };
               //console.log("qqqqq qhistoyr after", qHistory);
                setQHistory(qHistory);
                onOpenNextQuestion();
              }}
              onChangeMHistory={(r, cb) => {
               //console.log("qqqqq CHANGE MHISTORYYYYYYYYYYYYYYYYYYYY", r);
                mHistory ??= {};
                mHistory = { ...mHistory, ...r };
                setMHistory(mHistory);
                let ind = Math.min(
                  getActiveInd(data, mHistory),
                  data.modules.length - 1
                );
                setActiveInd(ind);
                setSelectedModuleInd(ind);
                setSelectedBlockInd(0);
                cb && cb();
                // onOpenNext()
              }}
              onOpenNextModule={() => {
               //console.log("777777 qqqqq open next module");
                onOpenNext();
              }}
              // questions={selectedModule.questions.map(_id => dbQuestionsObj[_id])}
            ></PreviewCourseModule>
          )}
          {!isOk && (
            <div className={"emptyModule"}>
              <div className="fa fa-lock" style={{ fontSize: "30px" }}></div>
              <div></div>
              Модуль будет открыт после <br />
              успешного прохождения предыдущих модулей
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CourseDetails;
