import React, {useState, useEffect} from 'react';
import {recognitionInit, recognitionStart, recognitionStop} from "./TrainMethods/AudioShort/AudioShort";
import mic from "./TrainMethods/AudioShort/mic.svg";

let mediaRecorder;
let chunks = [];

function Layout2(props) {
    let [process, setProcess] = useState(false)
    let [src, setSrc] = useState('')
    //console.log('*........ ## ROOT RENDER', props);

    useEffect(() => {
        // recognitionInit()
        // setTimeout(() => {
        //     recognitionStart(() => {
        //         console.log("qqqqq rec start", );
        //     })
        // })
        myPlayer({src: src})

    }, [src])

    function toggleRecording() {
        if (process) {
            stopRecording()
            setProcess(false)
        } else {
            startRecording()
        }
    }


    const startRecording = async () => {
        try {

            setSrc('')
            chunks = [];
            const stream = await navigator.mediaDevices.getUserMedia({audio: true});
            mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.ondataavailable = (e) => {
                chunks.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(chunks, {type: 'audio/wav'});
                const audioUrl = URL.createObjectURL(audioBlob);
                setSrc(audioUrl)
            };

            mediaRecorder.start();
            setProcess(true)

        } catch (e) {
            alert('Ошибка подключения микрофона')
        }

    };

    const stopRecording = () => {
        mediaRecorder.stop();
    };

    // let v = useActionData();
    return <div className={'tc'}>
        {/*{src}*/}
        {/*<audio controls id="audioPlayback" src={src} autoPlay={true}></audio>*/}
        {/*<hr/>*/}
        <div className={"svgContainer rel" + (process ? ' animate' : '')} onClick={() => {
            toggleRecording()
        }}>
            <div>
                <div className="zoomChild">
                    <div className="svg-box">
                        <div className={'counting'}>{'.'}</div>
                        <img src={mic} alt="" width={40} height={40}/>
                    </div>
                    <div className="circle delay1"></div>
                    <div className="circle delay2"></div>
                    <div className="circle delay3"></div>
                    <div className="circle delay4"></div>
                </div>
            </div>
        </div>
        <div className="mt-10" style={{marginTop: '20px'}}>
            <div className="mt-10">
                <Button
                    onClick={(cb) => {
                        cb && cb()
                        toggleRecording()
                    }}
                >{process ? 'Стоп' : 'Старт тестовой записи'}</Button>
            </div>
        </div>
        <div>
            <hr/>
            Если у вас не получается настроить микрофон обратитесь к вашему куратору или Сергею Титову
        </div>
    </div>
}

export default Layout2
