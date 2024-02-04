import React, { useEffect, useRef } from 'react';
import CodeMirror from 'codemirror';
import 'codemirror/lib/codemirror.css'; 
import 'codemirror/theme/dracula.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
// import { Socket } from 'socket.io';
import ACTIONS from '../Actions';

const Editor = ({socketRef, roomId, onCodeChange}) => {

    const editorRef =useRef(null);

    useEffect(() => {
        // console.log('useEffect is running');

        async function init() {
            // console.log('Initializing CodeMirror');
            editorRef.current = CodeMirror.fromTextArea(
                document.getElementById('realtimeEditor'), {
                mode: { name: 'javascript', json: true },
                theme: 'dracula',
                autoCloseTags: true,
                autoCloseBrackets: true,
                lineNumbers: true,
            });

            editorRef.current.on('change', (instance, changes) =>{
                console.log('changes', changes);
                const {origin} = changes;
                const code = instance.getValue();
                onCodeChange(code);
                if (origin !== 'setValue'){
                    console.log('working', code);
                    socketRef.current.emit(ACTIONS.CODE_CHANGE, {
                        roomId,
                        code,

                    });
                }
            });


            // socketRef.current.on(ACTIONS.CODE_CHANGE, ({code}) => {
            //         if(code !== null){
            //             editorRef.current.setValue(code);
            //         }
            // });


        }

        init();

        // Optionally, you can return a cleanup function if needed
    }, []); // Empty dependency array ensures useEffect runs only once

    useEffect(() => {
        if (socketRef.current) {
            socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
                // console.log('receiving', code);
                if (code !== null) {
                    editorRef.current.setValue(code);
                }
            });
        }
        return () => {
            socketRef.current.off(ACTIONS.CODE_CHANGE);
        };

    }, [socketRef.current]);


    return <textarea name="" id="realtimeEditor"></textarea>;
    
};

export default Editor;
