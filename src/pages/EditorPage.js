import React, { useRef, useState, useEffect } from 'react'
import Client from '../components/Client';
import Editor from '../components/Editor';
import { initSocket } from '../socket';
import ACTIONS from '../Actions';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const EditorPage = () => {

  const socketRef = useRef(null);
  const codeRef = useRef(null);
  const {roomId} =useParams();
  const location = useLocation();
  const reactNavigator = useNavigate();

  const [clients, setClients] = useState([]);
  const [isAsideOpen, setAsideOpen] = useState(false);

    useEffect(() => {
      const init = async () => {
        socketRef.current = await initSocket();
        socketRef.current.on('connect_error',(err) => handleError(err));
        socketRef.current.on('connect_failed',(err) => handleError(err));

        function handleError(e){
          console.log('socket error', e);
          toast.error('Socket connection failed, try again later.');
          reactNavigator('/');
        }



        socketRef.current.emit(ACTIONS.JOIN, {
          roomId,
          username:location.state?.username,
        });

        //Listening for joined event

        socketRef.current.on(
          ACTIONS.JOINED,
           ({clients, username, socketId}) =>{
          if (username !== location.state?.username){
              toast.success(`${username} joined the room. `);
              console.log(`${username} joined`);
          }
          setClients(clients);
          socketRef.current.emit(ACTIONS.SYNC_CODE, 
            {
              code: codeRef.current,
              socketId,
            }
            
            );
        })

        // Listening for Disconnected
        socketRef.current.on(ACTIONS.DISCONNECTED, ({socketId,username}) => {
          toast.success(`${username} left the room.`);
          setClients((prev) => {
            return prev.filter((client) => client.socketId !== socketId
              );
          });
        })

      };
      init();

      return () => {
        socketRef.current.disconnect();
        socketRef.current.off(ACTIONS.JOINED);
        socketRef.current.disconnect(ACTIONS.DISCONNECTED);
      }

    },[]);

     async function copyRoomId(){
      try{
        await navigator.clipboard.writeText(roomId);
        toast.success('Room ID has been copied to your clipboard');
      }
      catch(err){
        toast.error('Could not copy the Room ID');
        console.error(err);
      }
     }

      if(!location.state){
        return <Navigate to='/'/>
      }

    function leaveRoom(){
      reactNavigator('/');
    }

    const toggleAside = () => {
      console.log('Toggle Aside');
      setAsideOpen(!isAsideOpen);
    };

  return (
    <div className="mainWrap">


    <div className= {`aside ${isAsideOpen ? 'open' : ''}`}>
        <div className="asideInner">
          <div className="logo">
            <img 
            src="/code-sync.png"
             alt="logo" 
             className='logoImage' 
             />
          </div>
          <h3 style={{ display: 'flex', justifyContent: 'center'}}>Connected</h3>
          <div className="clientsList">
            {
              clients.map((client) => (
                <Client 
                key={client.socketId} 
                username={client.username} 
                />
              ))
            }
          </div>
        </div>
        <button className='btn copyBtn' onClick={copyRoomId}>Copy ROOM ID</button>
        <button className='btn leaveBtn' onClick={leaveRoom}>LEAVE</button>
      </div>

      <button className="toggleBtn" onClick={toggleAside}>
      {/* {isAsideOpen ? '☰' : '✕'} */}
      {isAsideOpen ? '☰' : '<>'}
    </button>
      <div className="editorWrap">
        <Editor socketRef={socketRef} roomId={roomId} onCodeChange={(code) => {codeRef.current = code}}/>
        {/* <Editor/> */}
      </div>
    </div>
  )
}

export default EditorPage