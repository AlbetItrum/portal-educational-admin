import React, {useState, useEffect, useRef, useImperativeHandle, forwardRef} from 'react';
import _ from 'underscore';
import './Animation.css'
import './AudioShorts.css'
import {
    Link, Outlet
} from "react-router-dom";
import mic from './mic.svg';
import Textarea from "../../../libs/Textarea";
import Player from "./Player";
import MdPreview from "../../Suggest/MdPreview";
import {stopAnyPlay} from "../../../App";
import DebugLogs from "../../DebugLogs";

let VIDEO_DOMAIN = global.env.VIDEO_DOMAIN;
let interimTranscript = '';
let finalTranscript = '';
let recognition;
let mediaRecorder;
let audioChunks = [];
let audioFile;
let aspectRatio = 1;
let _formData;
let recognizedDuration = 0;

let audioHash = '';
let sessionHash = '';
let recStartCd = new Date().getTime();


function getUserHash() {
    return Math.round(new Date().getTime() / 1000);
}

let lastUpdate = 0;

function updateUserHash(attempts) {

    if (new Date().getTime() - lastUpdate < 200) {
        return;
    }
    console.log("qqqqq UPDATE USER HASH",);
    lastUpdate = new Date().getTime();
    audioHash = getUserHash();
    sessionHash = sessionHash || audioHash;
    if (attempts == 1 || attempts == 0) {
        sessionHash = audioHash;
    }
}

let fbDetails = {};
let _titleInfo = {};

function onGlobalTryOpenQuiz(item) {
    let items = Storage.get('lastOpenItems') || []
    let _id = item?._id;

    items.unshift({_id, cd: Math.round(new Date().getTime() / 1000)})
    items = _.uniq(items, it => it._id).slice(0, 10)
    console.log("qqqqq on global try open quiz", item, items.map(it => it._id));

    Storage.set('lastOpenItems', items)

}


let AudioShort = forwardRef((props, ref) => {
    // console.log("qqqqq proppppppppppppppp", props);
    let [isAlreadyExistsFile, setIsAlreadyExistsFile] = useState(0)
    let [attempts, setAttempts] = useState(0)
    let [comment, setComment] = useState('')
    let [rate, setRate] = useState(0)
    let [codeRate, setCodeRate] = useState(0)
    let [selectedNames, setSelectedNames] = useState({})
    let [initMic, setInitMic] = useState(false)

    let [status, setStatus] = useState('waitStart')
    let [text, setText] = useState('')
    let [countDownBeforeStart, setCountDownBeforeStart] = useState(0)
    let [recognizing, setRecognizing] = useState(false)
    let [recording, setRecording] = useState(false)
    let [titleInfo, setTitleInfo] = useState(false)

    //on Remove
    let [perc, setCountPerc] = useState(0)
    let [cd, setCd] = useState(new Date());
    let [count, setCount] = useState(0)
    let [src, setSrc] = useState('/test.mp3')
    let {item, woNext, isExam} = props || {}
    let {attemptsForNextIfNot5 = 0} = props?.opts || {};
    let {desc, specialTitle, title, lng, smallTitle} = titleInfo || {};
    _titleInfo = titleInfo;

    let {opts, hist} = props;
    // let {hist} = opts || {};
    //redux alternative
    fbDetails = {
        rate, codeRate, growComment: comment, selectedNames, ind: (fbDetails.ind || 0) + 1,
    }

    useEffect(() => {
        recognitionInit()
        // props.onStart && props.onStart();
        // initWebCam()
        return () => {
            stopAnyPlay('unmount');
        }
    }, [])


    //trigger On change
    useEffect(() => {
        status == 'complete' && onChange({}, 'USEFEEECT1 + ')
        // }, [JSON.stringify({codeRate, rate, comment})])
    }, [JSON.stringify({rate, codeRate, comment})])

    useEffect(() => {
        setStatus('waitStart')
        // !recording && onChange({}, 'attempts update + ')
    }, [attempts])

    useEffect(() => {
        status === 'recording' && onChange({}, 'attempts update + ');
        // !recording && onChange({}, 'attempts update + ')
    }, [status])


    //set Start Attempt Value
    useEffect(() => {
        setStatus('waitStart')
        updateUserHash(attempts)


        let info = props.getItemNameAndDesc(item, props)

        setTitleInfo(info)
        setAttempts(props.getStartAudioAttempt ? props.getStartAudioAttempt(props.activeInd) : 0)

        console.log("qqqqq props.time ]]", hist, props);
        setIsAlreadyExistsFile(hist?.hash)
        if (hist?.hash) {
            console.log("qqqqq ALERT HIST HASH IS ArEADY EXISTS ________",);
            return;
        }
        if (props?.time < 1) {
            // onChange({}, 'recAutoComplete');
            if (isExam) {
                props.onNext && props.onNext()
            }
            return;
        }

        onGlobalTryOpenQuiz(item)
        playAndStart(info)
    }, [props.activeInd])


    let onChange = (data, sendKey) => {
        if (recording) {
            return;
        }

        let text = getText();
        let recognizedTextSize = (text || '').length || 0;

        audioHash && props.onChange && props.onChange({
            cd: new Date().getTime(),
            sendKey,

            titleInfo: _titleInfo,
            data: {
                hash: audioHash,
                sessionHash: sessionHash,
                ...data,
                recognizedText: text,
                recognizedSpeed: ((recognizedTextSize / (recognizedDuration || 1)) || 0).toFixed(2),
                recognizedDuration,
                recognizedTextSize,
                attempt: attempts,
                duration: 0,
                growTags: Object.keys(fbDetails.selectedNames).filter(it => selectedNames[it]),
                ...fbDetails || {},
                selectedNames: null,
                sendKey
            }
        })
    }

    let uploadToServerAudio = (formData, finalTranscript, opts) => {
        if (opts.woUploadAudio) {
            return;
        }
        formData.append('text', finalTranscript || '--');
        fetch(VIDEO_DOMAIN + (opts.uploadAudioUrl || '/api/upload-audio'), {
            method: 'POST',
            body: formData
        }).then(() => {
            global.http.get("/audio-uploaded", opts)
        })
    }

    let toggleRecoord = () => {

        console.log("qqqqq recognizeing", {recognizing, recording, isExam});
        if (recognizing) {
            return;
        }
        if (isAlreadyExistsFile && isExam) {
            return;
        }
        // if (!recording) {
        //     return;
        // }

        if (!recording) {
            console.log("qqqqq recognizeing TRUE",);
            recReStart()
        } else {
            console.log("qqqqq recognizeing FALSE",);
            recStop();
        }
    }

    let playAndStart = (info) => {
        let {title, smallTitle} = info;
        console.log("qqqqq titlttl", title, opts);

        if (!opts.playTextSpeechBeforeQuiz) {
            return recStart();
        }

        console.log("qqqqq smallTitle", {smallTitle});
        textToVoice({
            text: title + (/расскажите возможные а/gi.test(smallTitle) && smallTitle != title ? `. ${smallTitle}` : ``),
            lng,
            textToVoiceSpeedMSPerSymbolLimit: opts.textToVoiceSpeedMSPerSymbolLimit,
            textToVoiceTimeoutMS: opts.textToVoiceTimeoutMS,
        }, () => {
            console.log("qqqqq titlttl PLAY complete",);
            recStart();
        })
    }

    let resetScore = () => {
        setRate(0)
        setCodeRate(0)
        setComment('');
        setText('')
        setSelectedNames({})
        setInitMic(false)
    }

    let onRecordComplete = (formData, url) => {
        setStatus("complete")
        setRecording(false)
        setRecognizing(true)
        setText(finalTranscript || 'Распознавание');

        _formData = url;
        setSrc(_formData)

        if (!opts.isExam && opts.playTextSpeechAfterAudioRecord) {
            myPlayer({src: _formData})
        }

        console.log("qqqqq RRRRR C9999999999999999",);

        setTimeout(() => {

            getDuration(_formData, (r) => {
                recognizedDuration = r;
                console.log("qqqqq RRRRR C9999999999999999   222", r);

                setRecognizing(false)
                uploadToServerAudio(formData, finalTranscript, {audioHash})
                let text = getText();
                setText(text);
                onChange({}, 'recComplete');
                if (isExam) {
                    props.onNext && props.onNext()
                }
            })

        }, opts.msForRecognitionInnerProcess)

        // setCd(new Date())
    }

    let countdownAudioStart = (ms, cb) => {
        setCountDownBeforeStart(ms)
        setTimeout(() => {
            setCountDownBeforeStart(0)
            cb && cb()
        }, ms)
    }

    let __onRecStartFn = (cb) => {

        console.log("qqqqq titlttl REC START 99999999999999999999999");

        recognitionStart(() => {
            console.log("qqqqq titlttl REC START 1");
            updateUserHash();
            props.onChangeHash && props.onChangeHash({audioHash})
            setAttempts(++attempts)
            setInitMic(true)

            countdownAudioStart(opts.MSBeforeAudioStart || 0, () => {
                console.log("qqqqq titlttl REC START 2");
                setStatus("recording")
                resetScore()

                setInitMic(false)
                setRecording(true)
                recStartCd = new Date().getTime();
                cb && cb()
            })
        }, onRecordComplete)
    }

    let recStart = () => {
        __onRecStartFn(() => {
            props.onStart && props.onStart({}, props.activeInd)
        })
    }

    let recReStart = () => {
        __onRecStartFn(() => {
            props.onReStartAttempt && props.onReStartAttempt({}, props.activeInd)
        })
    }

    function getText() {
        return finalTranscript || '--'
    }


    let recStop = () => {
        setRecording(false)
        setTimeout(() => {
            recognitionStop()
            props.onStop && props.onStop();
        }, opts.msBeforeStopForRecognizingProcess || 100)

    }

    function onTimeOut() {
        recStop();
    }

    useImperativeHandle(ref, () => ({
        onTimeOut,
    }));

    let isErrRec = props.isErrRec;
    // recording && count && perc < 15

    let names = {
        confidence: 'Уверенности',
        undrstanding: 'Понимания вопроса',
        practic: 'Практич примеров',
        structure: 'Структурованности ответа',
        misclick: 'Сбился при надиктовке',
        other: 'Другое'
    }

    let disabled = rate != 5 && (attempts < (attemptsForNextIfNot5 || 0));
    let isNextMoveOnly = isExam && !recording && isAlreadyExistsFile;
    let isRewriteDisabled = status === 'complete' && !rate;
    console.log("qqqqq disabled", disabled, attempts, attemptsForNextIfNot5);
    return <div className={'audio-short rel '}
                data-recognizing={recognizing ? 1 : 0}
                data-recording={recording ? 1 : 0} data-exam={isExam ? 1 : 0}>


        <div className="tc w100 rel textwraps">
            <DebugLogs>
                Status: {status}
                <div></div>
                Init Mic: {initMic ? 'yes' : 'no'}
                <div></div>
                Debug Logs
                div
                Attempts: {attempts}
                <div>
                    attemptsForNextIfNot5: {attemptsForNextIfNot5}
                </div>
                disabled: {disabled}
            </DebugLogs>

            {/*<Button color={4} size={'xs'} onClick={() => {textToVoice()}}>Play</Button>*/}
            {/*{showDetails && <>Attempts: {attempts}</>}*/}


            <div className={"svgContainer rel"
                + (isRewriteDisabled ? ' o5' : '')
                + (recording ? ' animate' : '')
                + (isErrRec ? ' errRec' : '')} onClick={() => {
                if (!isRewriteDisabled) {
                    toggleRecoord()
                }
            }}>
                {!!countDownBeforeStart && <div className="afade countDownBeforeStart">
                    ...
                </div>}
                <div className="zoomChild">
                    <div className="svg-box">
                        {isErrRec ?
                            <div className={'backgWrap'} style={{opacity: .5 - .5 * (perc / 15)}}></div> : <></>}
                        <div className={'counting'}>{props.time || '-'}</div>
                        {!isExam && <>
                            {!countDownBeforeStart && !!attempts && <div className="rewriteMore">
                                <img src={'/icons/rewrite2.png'} alt=""/>
                                <span>Перезаписать еще раз
                                    {isRewriteDisabled && <div>Доступна после оценки</div>}
                                </span>
                            </div>}
                        </>}
                        <img src={mic} alt="" width={40} height={40}/>
                    </div>
                    <div className="circle delay1"></div>
                    <div className="circle delay2"></div>
                    <div className="circle delay3"></div>
                    <div className="circle delay4"></div>
                </div>


            </div>
            {isNextMoveOnly && <div style={{marginTop: '20px'}}>
                <Button onClick={(cb) => {
                    cb && cb()
                    props.onNext()
                }}>Идти дальше</Button>
            </div>}

            {!isNextMoveOnly && <>
                {recording && <div style={{marginTop: '20px'}} className={'afade'}><Button color={4} size={'md'}
                                                                                           onClick={(scb) => {
                                                                                               scb && scb()
                                                                                               toggleRecoord()
                                                                                           }}>Завершить запись</Button>
                </div>}
                {status !== 'complete' && !recognizing && !recording &&
                    <div style={{marginTop: '20px'}} className={'afade'}><Button color={4} size={'md'}
                                                                                 onClick={(scb) => {
                                                                                     scb && scb()
                                                                                     toggleRecoord()
                                                                                 }}>Начать запись</Button></div>}
            </>}

            {recognizing && <div className={'recognizing'}>Распознавание ... </div>}

            {!isExam && <>
                {!recognizing && !recording && text && <div className={'w100 tc animChild'} style={{marginTop: '30px'}}>
                    {/*<Button size={'xs'} onClick={() => recStart()}>Перезаписать ответ</Button>*/}
                    {/*<div></div>*/}
                    <div>
                        <small>Оцените ваш аудио ответ</small>
                    </div>
                    <div>
                        {([1, 2, 3, 4, 5] || []).map((it, ind) => {
                            return (
                                <span key={ind} className={'shortTag ' + (rate == it ? 'selected' : '')}
                                      onClick={() => {
                                          setRate(it)
                                      }}>
                        {it}
                    </span>)
                        })}
                    </div>
                    {props.showCodeRate && <>
                        <div>
                            <small>Оцените ваш код</small>

                        </div>
                        <div>
                            {([1, 2, 3, 4, 5] || []).map((it, ind) => {
                                return (
                                    <span key={ind} className={'shortTag ' + (codeRate == it ? 'selected' : '')}
                                          onClick={() => {
                                              setCodeRate(it)
                                          }}>
                        {it}
                    </span>)
                            })}
                        </div>
                    </>}
                    {!!rate && <div className={'animChild'}>
                        <div style={{marginTop: '10px'}}></div>
                        {/*<div*/}
                        {/*    className={'ib ' + (rate == 5 ? 'o333' : '')}*/}
                        {/*>*/}
                        {/*    <Button*/}
                        {/*        onClick={(scb) => {*/}
                        {/*            scb && scb()*/}
                        {/*            toggleRecoord()*/}
                        {/*        }}*/}
                        {/*        size={'sm'}*/}
                        {/*        color={!disabled ? 4 : 4}>Перезаписать</Button>*/}
                        {/*</div>*/}

                        {!woNext && <><Button
                            color={rate == 5 ? 0 : 4}
                            disabled={disabled || !rate}
                            size={'sm'}
                            onClick={(cb) => {
                                cb && cb();
                                // props.onSubmit && props.onSubmit();
                                props.onNext && props.onNext();
                            }}
                        >Дальше</Button>

                            {!!rate && !!attemptsForNextIfNot5 && !!disabled && <div>
                                <small>
                                    <div className={'error animChild ib'}>
                                        <div></div>
                                        <div></div>
                                        <div>
                                            Попробуй еще раз, так как ответ не на 5.
                                        </div>
                                        <div>
                                            После попытки #{attemptsForNextIfNot5} кнопка станет доступна.
                                        </div>
                                    </div>
                                </small></div>}

                            <div style={{marginTop: '15px'}}></div>
                        </>}
                        {/*{rate == 5 && <small>Какие еще есть точки роста (оставьте пустым если уже некуда развиваться*/}
                        {/*    дальше)</small>}*/}

                    </div>}
                    {opts.showGrowTags && !!rate && rate != 5 && <>
                        {rate != 5 && <small>Чего не хватило для 5?</small>}
                        <div className={'animChild'}>
                            {(Object.keys(names) || []).map((it, ind) => {
                                return (
                                    <span key={ind} className={'shortTag ' + (selectedNames[it] ? 'selected' : '')}
                                          onClick={() => {
                                              setSelectedNames({...selectedNames, [it]: !selectedNames[it]})
                                          }}>
                        #{names[it]}
                    </span>)
                            })}


                            {selectedNames.other && <>
                                <Textarea placeholder={'Чего не хватило на 5?'} label={' '} autoFocus={true}
                                          value={comment}
                                          onChange={(v) => {
                                              setComment(v || '')
                                          }}></Textarea>
                            </>}

                            <div></div>
                        </div>
                    </>}
                    {props.showRecognizedText && <div style={{marginTop: '10px'}}>
                        <div style={{marginTop: '10px', opacity: .2}}>
                            <small>Автоматическое распознавание текста: </small>
                            <div>{text}</div>
                        </div>
                    </div>}
                </div>}

            </>}
            <div className="sepAudio"></div>

            {!props.woTitle && <div style={{marginTop: '15px', display: 'block'}}>
                {smallTitle && <small className={''}>{smallTitle}</small>}
                {title && <div className={'audioTitle'}>
                    <MdPreview source={title}/>
                </div>}
                {specialTitle && <div className={'specialTitleInAudio'}>{specialTitle}</div>}
                {desc && <MdPreview source={desc}/>}
            </div>}
        </div>
        <div>

        </div>
        <audio id="hh" controls style={{opacity: 0, height: 0, overflow: 'hidden'}}></audio>
        {initMic && <div className="fadeDelay">
            <div className="initMic">
            </div>
            <div className="initMicCont">Инициализация
                <div></div>
                микрофона
            </div>
        </div>}

    </div>
});


// const base64Files = [
//     // {
//     //     base64Data: "encoded data 1",
//     //     fileName: "file2.txt",
//     //     mimeType: "text/plain",
//     // },
//     // Add more files as needed
// ];

// const additionalData = {
//     title: "File Upload",
//     desc: "Description of the uploaded files",
//     name: "John Doe",
//     folder: '15125125'
//     // Add more key-value pairs for additional data
// };

// sendBase64FilesWithAdditionalDataToServer(base64Files, additionalData);

function uploadImgsToServer(base64Files, data) {

    base64Files = base64Files.map(it => {
        return {...it, base: (it.base || '').replace('data:image/jpeg;base64,', '')}
    })
    global.http.post('/upload-video-by-images', {
        files: base64Files, data
    }, {domain: VIDEO_DOMAIN}).then(r => {
        //console.log('rrrrrr', r)
    })

}


function takeShot({videoWidth = 300}, cb) {
    const video = document.getElementById('webcam');
    canvas.width = videoWidth;//videoWidth;
    canvas.height = videoWidth / (aspectRatio || 1);//;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get the captured image as a data URL
    const capturedDataUrl = canvas.toDataURL('image/jpeg', 0.6); // JPEG format with 80% quality

    // Display the compressed image size
    // const capturedData = atob(capturedDataUrl.split(',')[1]);
    // const sizeBytes = capturedData.length;
    // sizeDisplay.textContent = Math.round(sizeBytes / 1000) + ' Kb';
    // document.querySelector('#capture').setAttribute('src', capturedDataUrl)
    return capturedDataUrl;

}

function getDuration(audioLink, cb) {
    const audio = new Audio(audioLink);

    let durationSecs = (new Date().getTime() - recStartCd) / 1000
    cb && cb(durationSecs)

//     audio.addEventListener('loadedmetadata', function () {
//         // Access the duration property to get the duration of the audio in seconds
//         const durationInSeconds = audio.duration;
//         window.audio = audio;
//         console.log("qqqqq durationInSeconds", durationInSeconds);
//
//         cb && cb(Math.round(audio.duration * 1000) / 1000)
//
//         // // You can format the duration as needed, for example, into minutes and seconds
//         // const minutes = Math.floor(durationInSeconds / 60);
//         // const seconds = Math.round(durationInSeconds % 60);
//         //
//         // //console.log(`Audio duration: ${minutes} minutes and ${seconds} seconds`);
//     });
//     audio.addEventListener('error', function (event) {
//         console.log("qqqqq durationInSecondsERRROR", durationInSeconds);
//
//         cb && cb(0)
//     });
//
// // Start loading the audio file
//     audio.load();

}


export function initWebCam() {
    const video = document.getElementById('webcam');

    navigator.mediaDevices.getUserMedia({video: true})
        .then(stream => {
            // window.stream = stream;
            video.srcObject = stream;
            aspectRatio = stream.getVideoTracks()[0].getSettings().aspectRatio;
        })
        .catch(error => {
            console.error('Error accessing webcam:', error);
        });

}

function getFake() {
    const base64AudioData = "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"; // Replace with your actual audio data

// Convert the Base64 audio data to binary data
    const binaryAudioData = atob(base64AudioData);

// Create a Uint8Array from the binary audio data
    const uint8Array = new Uint8Array(binaryAudioData.length);
    for (let i = 0; i < binaryAudioData.length; i++) {
        uint8Array[i] = binaryAudioData.charCodeAt(i);
    }
    return [uint8Array]
}

function micError() {
    let preventMicError = Storage.get('preventMicError')
    !preventMicError && alert('Проблемы с подключением микрофона! Сделайте отладку на странице тестирования микрофона')
}


// export async function recognitionStart2(cb, ecb) {
//     const stream = await navigator.mediaDevices.getUserMedia({audio: true});
//     mediaRecorder = new MediaRecorder(stream);
//
//     mediaRecorder.ondataavailable = (e) => {
//         chunks.push(e.data);
//     };
//
//     mediaRecorder.onstop = () => {
//         const audioBlob = new Blob(chunks, {type: 'audio/wav'});
//         const audioUrl = URL.createObjectURL(audioBlob);
//         document.getElementById('audioPlayback').src = audioUrl;
//     };
//
//     mediaRecorder.start();
// }

export function recognitionStart(startCb, completeCb,) {


    //console.log('recognitionInit', recognition)
    finalTranscript = ''
    interimTranscript = '';

    recognition.start();

    let preventMicError = Storage.get('preventMicError')
    if (!preventMicError && (!navigator || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)) {
        return micError();
    }
    console.log("qqqqq titlttl REC START 444444");

    navigator.mediaDevices
        .getUserMedia({audio: true})
        .then((stream) => {
            console.log("qqqqq titlttl REC START 555555");

            startCb && startCb()
            audioChunks = [];
            mediaRecorder = new MediaRecorder(stream, {
                //   mimeType: 'audio/ogg; codecs=opus',
                audioBitsPerSecond: 16000, // Adjust as needed (e.g., 32000 for 32 kbps)
                sampleRate: 16000, // Adjust as needed (e.g., 16000 Hz)
            });

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                console.log("qqqqq on stop 999999999999999999999999999999",);
                onSend(audioChunks)

            };

            mediaRecorder.start();
            // startRecordingButton.disabled = true;
            // stopRecordingButton.disabled = false;
        })
        .catch((error) => {
            // alert(error)
            // console.log("qqqqq errrr", error);
            if (preventMicError) {
                startCb && startCb()
            }
            micError();
            mediaRecorder = {}
            mediaRecorder.stop = () => {
                onSend(getFake())
            };
            console.error('Error accessing microphone:', error);
        });


    function onSend(_audioChunks) {
        const audioBlob = new Blob(_audioChunks, {type: 'audio/wav'}); // You can change the format if needed
        // const audioBlob = new Blob(getFake(), {type: 'audio/wav'}); // You can change the format if needed
        const formData = new FormData();
        formData.append('user', user.get_id())
        formData.append('audio', audioBlob, audioHash + '.wav');


        audioFile = formData;
        completeCb && completeCb(audioFile, URL.createObjectURL(audioBlob));

        audioChunks = [];
    }


}

export function recognitionInit(cb) {
    recognition = new webkitSpeechRecognition(); // Create a SpeechRecognition object

    recognition.lang = 'ru-EN'; // Set the language for recognition (e.g., 'en-US' for English)
    recognition.interimResults = true; // Enable interim results
    recognition.continuous = true;


    recognition.onresult = (event) => {

        interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        // //console.log('stop RECOGNITION!!!', interimTranscript)
        // window.stopRecognition && window.stopRecognition
        // transcriptionDiv.innerHTML = finalTranscript; // Display the final transcription
    };


}

export function mediaInit() {
    alert('media init')
    // try {
    //     console.log("qqqqq titlttl REC START 88888");
    //
    //     navigator.mediaDevices
    //         .getUserMedia({audio: true})
    //         .then((stream) => {
    //             console.log("qqqqq titlttl REC START 99999");
    //
    //             let mediaRecorder = new MediaRecorder(stream, {
    //                 //   mimeType: 'audio/ogg; codecs=opus',
    //                 audioBitsPerSecond: 16000, // Adjust as needed (e.g., 32000 for 32 kbps)
    //                 sampleRate: 16000, // Adjust as needed (e.g., 16000 Hz)
    //             });
    //             mediaRecorder.stop && mediaRecorder.stop()
    //         })
    //
    // } catch (e) {
    //
    // }

}

export function recognitionStop() {

    mediaRecorder && mediaRecorder.stop && mediaRecorder.stop();
    recognition && recognition.stop && recognition.stop();
    // mediaRecorder && mediaRecorder.onstop && mediaRecorder.onstop();
    // wid

    // //console.log('STOPPPP finalTranscript!!!', interimTranscript, finalTranscript)

    // setTimeout(() => {
    //     //console.log('STOPPPP finalTranscript', interimTranscript, finalTranscript, audioFile)
    // }, 1000)

    // startRecordingButton.disabled = false;
    // stopRecordingButton.disabled = true;

}


export default AudioShort