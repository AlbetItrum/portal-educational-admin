import React, {lazy, Suspense, useState} from 'react';
import {Editor, loader} from "@monaco-editor/react";
import * as monaco from 'monaco-editor';
loader.config({ monaco });

function EditDirect(props) {
    return <Editor {...props}></Editor>
}

export default EditDirect
