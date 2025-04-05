import React, {useEffect, useRef, useState} from 'react';
import _ from 'underscore';
import MDEditorComp from './MDEditorComp';
import {
    Link, Outlet
} from "react-router-dom";
import './codeRun.css'
import MDEditor from "@uiw/react-md-editor";
import MyModal from 'libs/MyModal';
import QuestionDetails from "./QuestionDetails";
import Smart from 'libs/Smart';
import {statuses} from './Table';
import QuizQuestion from "./QuizQuestion";
import Textarea from 'libs/Textarea';
import functionsStr from './FunctionsStr'
import user from 'libs/user/user'
import QuestionCorrectSolution from "./QuestionCorrectSolution";
import CustomStorage from "./CustomStorage";
import LazyEditor from "../LazyEditor/LazyEditor";

let renderCount = 1;

function QuestionSolution() {
    return null;
}

function CodeRunComponent(props) {
    let [code, setCode] = useState('');
    let [validateErrors, setValidateErrors] = useState([]);
    let [logsReader, setLogsReader] = useState('[]');
    let {isExam, onChangeCode, onChangeLogs} = props;
    global.setHistoryObj = (histObj, v) => {
        setData({...data, historyObj: histObj[getQuestionId()]})
    };


    let [forceRenderLogs, setForceRenderLogs] = useState(-1)
    let [hintInd, setHintInd] = useState(-1)
    let [history, setHistory] = useState(-1)

    let [files, setFiles] = useState([])

    let [selectedFileInd, setSelectedFileInd] = useState(0)
    let [runLoading, setRunLoading] = useState(false)
    let [curCasesStr, setCurCasesStr] = useState('')
    let [cases, setCases] = useState([])
    let [jsDetails, setJsDetails] = useState({})
    let [topTab, setTopTab] = useState('condition')
    let [runResults, setRunResults] = useState({})
    let [runSubmitResults, setRunSubmitResults] = useState({})
    let [activeCaseInd, setActiveCaseInd] = useState(0)
    let [data, setData] = useState({})
    let [dragOpts, setDragOpts] = useState({})
    let [opts, setOpts] = useState({})
    const parentTopRef = useRef(null);
    const parentRightRef = useRef(null);
    const topRef = useRef(null);
    const botRef = useRef(null);
    const rightRef = useRef(null);
    const leftRef = useRef(null);
    let hintModal;
    let solutionModal;

    useEffect(() => {
        initExam();
    }, [(props.question || {})._id]);

    function getFileName(ind = selectedFileInd, _files) {
        ind = ind || 0;

        return ((_files || files || [])[ind] || {}).name || '';
    }

    function getStarter(jsDetails, ind = 0, fname) {
        let fileName = fname || getFileName(ind);
        return ((jsDetails.starterFiles || {})[fileName] || '') || (jsDetails.starter || '') || ''
    }

    function initExam() {
        let {jsDetails = {}, history = {}, runResults, question, cases} = props;
        history ??= {}
        history.files ??= {}

        let str = history.testCasesStr || jsDetails.curCasesStr || jsDetails.pubCasesStr || ''
        let _cases = buildTestCases(str, jsDetails.fields)
        let fileName = getFileName(0, jsDetails.files)
        let __code = !isLogsRaederFn(jsDetails) ? ((history || {}).files || {})[fileName] || getStarter(jsDetails, 0, fileName) : getStarter(jsDetails, 0, fileName);
        setCode(__code)
        setLogsReader((history || {}).logsReader || `[]`)
        setCurCasesStr(str)
        setHistory(history)
        setCases(_cases)
        setJsDetails(jsDetails)
        setRunResults(runResults)
        setFiles(jsDetails.files || [])
        return;
    }


    useEffect(() => {
        window.listenCtrlS = () => {
            setTopTab('logs');
            setForceRenderLogs(new Date().getTime());
        }
        topRef.current.style.height = Storage.get('codeResizeTop') || '70%'
        rightRef.current.style.width = Storage.get('codeResizeLeft') || '50%'
        setBotRef();
        setLeftRef();
      
    }, [])

    function getQuestionId() {
        return window.location.href.split('=')[1] || 1061
    }

    function run(params) {
        setTopTab('results')
        setRunLoading(true)

        global.http.post('/run-question', {
            curCasesStr,
            isExam,
            files: {'': code},
            logsReader,
            question: question._id || getQuestionId(),
            ...params
        })
            .then(r => {
                setRunLoading(false)
                let {wrongCount} = r

                function trySet(key, keys) {
                    let curStatus = (data.historyObj || {}).status
                    if (keys.indexOf(curStatus) < 0) {
                        Storage.changeStatus({_id: getQuestionId(), status: key})
                    }
                }

                if (params && params.isSubmit) {
                    !wrongCount && trySet('very_good', ['very_good'])

                    setRunSubmitResults(r)
                } else {
                    !wrongCount && trySet('norm', ['good', 'very_good'])
                    setRunResults(r)
                    props.onChangeRunResults && props.onChangeRunResults(r)
                    r.firstError && setActiveCaseInd(r.firstError.ind)
                }
            })
    }

    function submit() {
        run({isSubmit: true})
    }

    function setBotRef() {
        let perc = 100 - parseFloat(topRef.current.style.height);
        botRef.current.style.height = perc + '%'
    }

    function setLeftRef() {
        let perc = 100 - parseFloat(rightRef.current.style.width);
        leftRef.current.style.width = perc + '%'
    }


    function getHeight(el) {
        return el.clientHeight;
    }

    function getWidth(el) {
        return el.clientWidth;
    }

    function saveChanges(code, file, cb) {
        if (isExam) {
            return;
        }
    }


    function buildTestCases(str, fields) {
        let size = (fields || []).length;
        if (!size) {
            return []
        }

        let res = [];
        let arr = (str || '').split("\n");
        try {

            for (let i = 0; i < arr.length; i += fields.length) {
                let d = [];
                for (let j = 0; j < size; j++) {
                    let it;
                    try {
                        let vv = eval(`let x = [{name: '124', age: 22}, {name: "age25", age: 25}];
                        x`)
                        it = JSON.parse(arr[i + j]);
                    } catch (e) {
                        it = arr[i + j]
                    }
                    d.push(it)
                }
                res.push(d)
            }
        } catch (e) {
    console.log(e);
        }
        return res;
    }

    function getTestCase() {
        return (cases || [])[activeCaseInd || 0] || '';
    }

    function onChangeCodeLocal(code) {
        let fileName = getFileName();
        history.files[fileName] = code;

        setCode(code);
        setHistory(history);

        if (isExam) {
            onChangeCode && onChangeCode(code, fileName, getTestCase())
        } 
    }

    function onChangeLogsLocal(logs) {
        setLogsReader(logs)
        onChangeLogs && onChangeLogs(logs)
    }


    function isLogsRaederFn(jsDetails) {
        console.log('jsDetails=================>', jsDetails);
        
        let {codeType} = jsDetails || {};
        let isLogsReader = codeType === 'logreader'
        return isLogsReader;
    }

    let directCodeSolutionModal;
    let question = props.question || (data || {}).question || {};
    let caseItem = (cases || [])[activeCaseInd]
    let firstErrorInd = !runResults ? -1 : (runResults || {}).firstError ? ((runResults || {}).firstError || {}).ind : 99999;
    let casesModal;
    let isLogsReader = isLogsRaederFn(jsDetails)

    function getFileExt() {
        let name = getFileName(selectedFileInd)
        let arr = (name || '').split('.')
        let last = arr[arr.length - 1];
        let ext = last === 'css' ? 'css' : last === 'html' ? 'html' : last === 'ts' ? 'typescript' : 'javascript';

        return ext;
    }

    let isNewExam = props.isNewExam;
    return <div
        className={'codeRunWrap ' + (dragOpts.drag1 || dragOpts.drag2 ? 'dragging' + (dragOpts.drag1 ? '1' : 2) : '')}
        ref={parentRightRef}
        onMouseDown={(e) => {
            let dragKey = e.target.getAttribute('id');
            (/drag1|drag2/gi.test(dragKey)) && setDragOpts({[dragKey]: true})
        }}
        onMouseUp={() => {
            let {drag1, drag2} = dragOpts || {};
            if (drag1 || drag2) {
                setDragOpts({})
            }
        }
        }
        onMouseMove={(e) => {
            let {drag1, drag2} = dragOpts;

            if (!drag1 && !drag2) return;
            if (drag1) {
                let MIN_MAX = 20
                let y = e.clientY + 10 - 50;
                let total = getHeight(parentTopRef.current)//.top
                let perc = Math.min(100 - MIN_MAX, Math.max(MIN_MAX, Math.round(100 * (y / total)))) + '%';
                topRef.current.style.height = perc;
                setBotRef();
                Storage.set('codeResizeTop', perc)
            } else if (drag2) {
                let MIN_MAX = 20
                let x = e.clientX - 10 - 320;
                let total = getWidth(parentRightRef.current)
                let perc = Math.min(100 - MIN_MAX, Math.max(MIN_MAX, 100 - Math.round(100 * (x / total)))) + '%';
                rightRef.current.style.width = perc;
                setLeftRef();
                Storage.set('codeResizeLeft', perc)
            }
        }
        }
    >
        <div className="crLeft" ref={leftRef}>
            <div className={'mainTasksWrap'}>

                <div className="pull-right">
                    <div className="buttonsRun2">
                        {!props.isNewExam && <>
                            <button title="Пояснение" className={'btn btn-xs btn-default'} onClick={() => {
                                solutionModal.show();
                            }}><span className="fa fa-book" style={{padding: '0'}}></span></button>

                            <button title="Решение" className={'btn btn-xs btn-default'} onClick={() => {
                                directCodeSolutionModal.show();
                            }}><span className="fa fa-code" style={{padding: '0'}}></span></button>
                        </>}
                        {<div className={'ib ' + (jsDetails.hideRunStatus == 'hidden' ? 'hiddenBlock' : '')}>
                            <button className={'btn btn-xs btn-default'} disabled={runLoading} onClick={() => run()}>Запуск
                            </button>
                            {!props.isNewExam &&
                                <button className={'btn btn-xs btn-primary'} onClick={() => submit()}>Сабмит
                                </button>}
                        </div>}
                        {!!question.hints && !!question.hints.length &&
                            <button title="Подсказка" className={'btn btn-xs btn-default'} onClick={() => {
                                setHintInd(0)
                                hintModal.show();
                            }}><span className="fa fa-info" style={{padding: '0 5px'}}></span></button>}
                        <MyModal
                            size={'full'}
                            ref={(el) => solutionModal = el}
                        >
                            <QuestionDetails withoutShow={true} question={question}></QuestionDetails>
                        </MyModal>
                        <MyModal
                            size={'full'}
                            ref={(el) => directCodeSolutionModal = el}
                        >
                            <QuestionCorrectSolution details={jsDetails}></QuestionCorrectSolution>
                        </MyModal>
                        <MyModal
                            size={'small'}
                            ref={(el) => hintModal = el}
                        >
                            <HintsContent hints={question.hints}></HintsContent>
                        </MyModal>

                    </div>
                </div>
                <div className="code-run-tab-wrap">
                    {([{name: 'Условие', type: 'condition'}, {
                        name: 'Результаты',
                        type: 'results'
                    }, !isLogsReader ? {
                        name: 'Логи (ctrl^s)',
                        type: 'logs'
                    } : null] || []).map((it, ind) => {
                        if (!it) return <></>
                        return (<a className={'code-run-tab ' + (it.type == topTab ? 'active' : '')}
                                   style={{marginRight: '5px'}} key={ind} onClick={() => {
                            setTopTab(it.type)
                        }}>
                            {it.name}
                        </a>)
                    })}
                </div>
            </div>
            <div className="crVertWrap" ref={parentTopRef}>
                <div className="crTop" ref={topRef}>
                    <div className="vertChild rel" style={{overflowX: 'hidden', paddingTop: '45px', minHeight: '100%'}}>
                        {topTab === 'logs' && !isLogsReader && <>
                            <IframeToRunLocal
                                isNewExam={isNewExam}
                                cases={cases}
                                activeCaseInd={activeCaseInd}
                                code={code}
                                jsDetails={jsDetails}
                                question={question}
                                forceRenderLogs={forceRenderLogs}
                            ></IframeToRunLocal>
                        </>}
                        {topTab === 'condition' &&
                            <div style={{padding: '15px'}}>
                                <MDEditor.Markdown data-color-mode="light"
                                                   source={question.name}/>

                                {isLogsReader && <>
                                    <hr/>
                                    Поле для ввода логов
                                    <LazyEditor
                                        height="300px"
                                        defaultLanguage="javascript"
                                        defaultValue="[]"
                                        options={{
                                            minimap: {
                                                enabled: false
                                            }
                                        }}
                                        value={logsReader}
                                        onChange={(v) => {
                                            onChangeLogsLocal(v)
                                        }
                                        }
                                    />
                                </>}
                            </div>}
                        {topTab === 'results' && <div className={runLoading ? 'o5' : ''}>
                            <div>
                                <small>Результаты запуска</small>
                                <RunResults runResults={runResults} fields={data.fields}></RunResults>
                                {!isNewExam && <>
                                    <hr/>
                                    <small>Результаты запуска Сабмит</small>
                                    <RunResults runResults={runSubmitResults} fields={data.fields}></RunResults></>}
                            </div>
                        </div>}
                    </div>
                    <div className="resizeH" id={'drag1'}></div>
                </div>
                <div className="crBot" ref={botRef}>
                    <div className={"vertChild casesChild " + (isLogsReader ? 'logsRader' : '')}>

                        {!isLogsReader && <>
                            <div className="">
                                <div className="cases-wrap">
                                    {(cases || []).map((caseItem, ind) => {
                                        return (<div key={ind}
                                                     status={(firstErrorInd == -1 ? '' : (firstErrorInd > ind) ? 'ok' : firstErrorInd === ind ? 'error' : '')}
                                                     className={'btn btn-xs btn-default case-title ib ' + (activeCaseInd == ind ? 'active-case' : '')}
                                                     onClick={() => setActiveCaseInd(ind)}>
                                            <div>
                                                <span className={'run-circle'}></span> Кейс #{ind + 1}
                                            </div>
                                        </div>)
                                    })}
                                    <div className="ib btn btn-xs btn-default case-title" onClick={() => {
                                        casesModal.show()
                                    }}>
                                        <div className="fa fa-edit"></div>
                                    </div>
                                    <MyModal
                                        ref={(el) => casesModal = el}
                                    >
                                        <EditCasesModal curCasesStr={curCasesStr}
                                                        onSave={(v) => {
                                                            let original = (jsDetails || {}).pubCasesStr;
                                                            let isReset = !v || (v === original);
                                                            v = v || original;
                                                            setCurCasesStr(v)
                                                            props.onChangeCurStr && props.onChangeCurStr(v)

                                                            setCases(buildTestCases(v, jsDetails.fields))
                                                            casesModal.hide();
                                                            if (isExam) {
                                                                props.onChangeCurStr && props.onChangeCurStr(v, isReset)
                                                            } else {
                                                                global.http.post('/update-test-case', {
                                                                        questionId: question._id,
                                                                        value: v,
                                                                        isReset
                                                                    }
                                                                )
                                                                    .then()
                                                            }
                                                        }
                                                        }></EditCasesModal>

                                    </MyModal>
                                </div>
                                {caseItem && (jsDetails.fields || []).map((it, ind) => {
                                    return (<div key={ind}>
                                        {it.name} = {JSON.stringify(caseItem[ind])}
                                    </div>)
                                })}
                            </div>
                        </>}
                        {isLogsReader && <>
                            Нет кейсов для запуска - т.к. задача заключается в том чтобы укзаать логи в поле выше
                        </>}
                        <hr/>
                        {(validateErrors || []).map((error, ind) => {
                            return (<div key={ind} style={{fontSize: '12px'}}>
                                Line: [{error.startLineNumber}] {error.message}
                                <hr/>
                            </div>)
                        })}
                    </div>


                </div>

            </div>
            <div className="resizeV" id={'drag2'}></div>

        </div>
        <div className="crRight" ref={rightRef}>
            <div className="filesWrap">
                <div className="btn-reset">
                    <button className={'btn btn-xs btn-default'} onClick={() => {
                        onChangeCodeLocal(getStarter(jsDetails))
                    }}>Оригин. код
                    </button>
                </div>
                {files && files.length > 1 && (files || []).map((it, ind) => {
                    return <div
                        key={ind}
                        onClick={() => {
                            let _code = ((history || {}).files || {})[it.name] || getStarter(jsDetails, ind);
                            setSelectedFileInd(ind)
                            setCode(_code)
                        }}
                        className={'ib filesItem ' + (ind === selectedFileInd ? 'selectedFile' : '')}>{it.name || '-'}</div>
                })}
            </div>
            {jsDetails._id}

            <SmartCodeEditor
                {...{
                    getFileExt, isLogsReader, code, setValidateErrors, onChangeCodeLocal,
                    reRender: ((isLogsReader ? 'READ' : 'EDIT') + '___' + (props.question || {})._id || '--') + '_' + selectedFileInd
                }}
            ></SmartCodeEditor>
        </div>
    </div>
}

function SmartCodeEditor({getFileExt, code, reRender, setValidateErrors, onChangeCodeLocal, isLogsReader}) {
    let [loading, setLoading] = useState(false);
   //console.log("qqqqq smart editor44444444", code, isLogsReader, reRender);
    useEffect(() => {
        setLoading(true)
        setTimeout(() => {
            setLoading(false)
        })
    }, [reRender])
    if (loading) {
        return <></>
    }
    return <LazyEditor
        height="calc(100% - 12px)"
        defaultLanguage={getFileExt()}
        language={getFileExt()}
        defaultValue=""
        options={{
            readOnly: isLogsReader,
            minimap: {
                enabled: false
            }
        }}
        onValidate={(e) => {
            setValidateErrors(e)
        }
        }
        value={code}
        onChange={(v) => {
            if (v != code) {
                onChangeCodeLocal(v)
            }

        }
        }
    />
}


function EditCasesModal(props) {
    let [str, setStr] = useState('')
    useEffect(() => {
        setStr(props.curCasesStr)
    }, [props.curCasesStr])
    let {onSave, onReset} = props;

    return <div>
        <strong>Добавить или отредактировать запускные кейсы</strong>
        <hr/>
        <Textarea value={str} onChange={(v) => {
            setStr(v)
        }
        }>{str}</Textarea>
        <hr/>
        <button className={'btn btn-md btn-primary'} onClick={() => {
            onSave && onSave(str)
        }}>Save
        </button>
        <button className={'btn btn-md btn-default'} onClick={() => {
            onSave && onSave('')
        }}>Reset To Default
        </button>
    </div>
}


function HintsContent(props) {
    let [hintInd, setHintInd] = useState(0);
    let {hints = []} = props;
    hints = hints || []

    return <div>Подсказка ({hintInd + 1} из {hints.length})

        <hr/>
        {(hints[hintInd] || {}).desc}
        {hints.length > 1 && <>
            <hr/>
            <button onClick={() => setHintInd((hintInd + 1) % hints.length)}>След</button>
            <button onClick={() => setHintInd((hints.length + hintInd - 1) % hints.length)}>Пред</button>
        </>}

    </div>
}


function tryCatchWrap(code) {
    return `try {
    ${code}
} catch(e) {
   //console.log(e.toString());
}`
}

const IframeToRunLocal = React.memo((props) => {
    // Your component logic here
    return <IframeToRunLocal2 {...props}></IframeToRunLocal2>
}, (prevProps, nextProps) => {
    // Compare only the 'ind' prop
    return prevProps.forceRenderLogs === nextProps.forceRenderLogs;
});


function IframeToRunLocal2(props) {
    let {code, data, isNewExam, activeCaseInd, forceRenderLogs, question, cases, jsDetails} = props;
    let {codeType, fnName, fields} = jsDetails || {};
    let [cd, setCd] = useState(new Date().getTime());
    let [isSecond, setSecond] = useState(false);
    let isFirst = useRef(null)

    useEffect(() => {
        // setTimeout(() => {
        //     setSecond(true)
        // }, )
        isFirst.current = true;
    }, [forceRenderLogs, activeCaseInd])
    let renderTime = ++renderCount;


    // console.clear();

    let url = global.env.domain
        + "/" + (isFirst.current ? 'files' : 'init')
        + "/" + user.get_id() + "/" + question._id + "/index.html?cd=" + new Date().getTime()

    if (isNewExam) {
        let examId = CustomStorage.getId();
        url = global.env.domain
            + "/" + (isFirst.current ? 'admin_files' : 'admin_init')
            + "/" + examId + "/" + question._id + "/index.html?cd=" + new Date().getTime()

    }
    return <div className='logsRunWraps'>
        <a href={url} target={"_blank"} className="pull-right" style={{marginRight: '5px'}}>
            <i className="fa fa-external-link" aria-hidden="true"></i>
        </a>
        <a onClick={() => {
            setCd(new Date().getTime())
        }}><small style={{paddingLeft: '10px'}}>Перезапустить логи (ctrl & s)</small>
        </a>
        <iframe style={{width: '100%'}} src={url}></iframe>
    </div>
}


function RunResults(props) {
    function pubResults(r) {
        r = r || {};
        let data = r.ms == '0s' ? r.value : r;
       //console.log("qqqqq rrrrrr", r);
        return JSON.stringify(data, null, 4)
    }


    let {runResults} = props || {};

   //console.log("qqqqq run Results", runResults);
    let {firstError, totalCount, passCount, wrongCount, logResponse} = runResults || {};
    totalCount = totalCount || (logResponse ? 1 : 0);
    let firstErrorMsg = (firstError || {}).errMsg || ''
    return !totalCount ? <div>Тесты еще не запускались</div> : <div>
        <div>Пройдено тестов {passCount} из {totalCount}</div>
        {logResponse && <div><small>Logs Response:</small>{(logResponse || []).map((it, ind) => {
            return (<pre key={ind}>
                {JSON.stringify(it)}
            </pre>)
        })}

        </div>}

        {/*Успешных кейсов {totalCount - wrongCount} из {totalCount}*/}
        {firstErrorMsg && <div>Ошибка выполнения программы: <div>{firstErrorMsg}</div></div>}
        {!firstErrorMsg && firstError && <div>
            <div>Ошибка в тест кейсе #{firstError.ind + 1}

                <div className="row np">
                    {(props.fields || []).map((field, ind) => {
                        return (<div className="col-sm-6" key={ind}>
                            <small>{field.name}:</small>
                            <pre>{JSON.stringify(firstError.params[ind], null)}</pre>

                        </div>)
                    })}
                </div>
                <div className="row np">
                    <div className="col-sm-6">
                        <small>Текущий Результат: </small>
                        <pre>{pubResults(firstError.res1)}</pre>
                    </div>
                    <div className="col-sm-6">
                        <small>Ожидаемый: </small>
                        <pre>{pubResults(firstError.res2)}</pre>


                    </div>
                </div>
            </div>

        </div>}

        {!wrongCount && totalCount && <div>Поздравляем тест пройден</div>}

    </div>
}


function getCode() {
    let str = `
console.log('1');

setTimeout(() => {
 //console.log('2');
  Promise.resolve().then(() => console.log('3')).then(() => console.log('4'));
}, 0);

console.log('11');

new Promise((resolve, reject) => {

  setTimeout(() => {
   //console.log('8')
  });
  
  Promise.resolve().then(() => console.log('10'))
  
 //console.log('9');
});

setTimeout(() => {
 //console.log('13');
}, 100);

console.log('12');

setTimeout(() => {
 //console.log('5');
}, 0);

Promise.resolve().then(() => console.log('6')).then(() => console.log('7'));

console.log('8');`;

    let nums = _.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);

    let repl = str.replace(/[0-9]+/gi, (...args) => {
        let v = +args[0];
        return v == 0 || v > 99 ? v : nums[v - 1]
    });


    return repl;
}


export default CodeRunComponent
