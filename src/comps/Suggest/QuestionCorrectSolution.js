import React, {useEffect, useState} from 'react';
import _ from 'underscore';

import {
    Link, Outlet
} from "react-router-dom";
import Editor from "@monaco-editor/react";
import LazyEditor from "../LazyEditor/LazyEditor";


function getFileExt(name){
    let arr = (name || '').split('.')
    let last = arr[arr.length - 1];
    let ext =  last === 'css' ? 'css' : last === 'html' ? 'html' : last === 'ts' ? 'typescript' : 'javascript';

    return ext;
}

function Layout2(props) {
    let [selectedSolutionFileInd, setSelectedSolutionFileInd] = useState(0);

    let {details} = props;
    details ??= {}
    let {files = [{name: ''}]} = details;
    let data = {details}

    let selectedSolutionFileName = (files[selectedSolutionFileInd] || {}).name
    let isFiles = files.length > 1;

    return <>
        {isFiles && (files || []).map((it, ind) => {
            return <div
                onClick={() => {
                    setSelectedSolutionFileInd(ind)
                }}
                className={'ib filesItem ' + (ind === selectedSolutionFileInd ? 'correct' : '')}>{it.name || '-'}</div>
        })}
        <LazyEditor
            height="calc(100vh - 150px)"
            defaultLanguage={getFileExt(selectedSolutionFileName)}
            language={getFileExt(selectedSolutionFileName)}
            value={
                ((details.solutionFiles || {})[selectedSolutionFileName]) || ((details || {}).correctSolution) || ''
            }
            onChange={(solution) => {
               //console.log("qqqqq ignore changes", );
            }}
        />
    </>
}

export default Layout2
