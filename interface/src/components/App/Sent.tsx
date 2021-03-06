import { useState, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import Deb0x from "../../ethereum/deb0x"
import {
    Tooltip, List, ListItem, Chip,
    ListItemText, ListItemButton, Typography, Box, CircularProgress, Stack
} from '@mui/material';
import Stepper from './Stepper'
import { border } from '@mui/system';
import IconButton from "@mui/material/IconButton";
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import Pagination from "@mui/material/Pagination";
import RefreshIcon from '@mui/icons-material/Refresh';
import Refresh from '@mui/icons-material/Refresh';
import Button from "@mui/material/Button";
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import '../../componentsStyling/decrypt.scss';
import empty from '../../photos/empty.png';

const axios = require('axios')
const deb0xAddress = "0x13dA6EDcdD7F488AF56D0804dFF54Eb17f41Cc61"

export function Sent(props: any): any {
    const { account, library } = useWeb3React()
    const [loading, setLoading] = useState(true)
    const [encryptionKeyInitialized, setEncryptionKeyInitialized] = useState<boolean|undefined>(undefined)


    useEffect(() => {
        console.log("useEffect")
        setLoading(true)
        getPublicEncryptionKey()
    }, [account]);

    const getPublicEncryptionKey = async () => {
        const deb0xContract = Deb0x(library, deb0xAddress)
        const key = await deb0xContract.getKey(account)
        const initialized = (key != '') ? true : false
        setEncryptionKeyInitialized(initialized)
    }

    

    async function decrypt(encryptedMessage: any) {
        try {
            const decryptedMessage = await library.provider.request({
                method: 'eth_decrypt',
                params: [encryptedMessage, account],
            });
            return decryptedMessage
        } catch (error) {
            return undefined
        }
    }

    async function fetchMessage(message: any) {
        return await axios.get(`https://ipfs.io/ipfs/${message}`)
    }

    function Message(props: any) {
        const encryptMessage = props.message.fetchedMessage.data
        const [message, setMessage] = useState(props.message.fetchedMessage.data)
        const [recipients, setRecipients] = useState<string[]>([]);
        //const [sender, setSender] = useState(props.messsage.sender)
        const [messageTime,setMessageTime] = useState("July 03, 12:45")
        const [isDecrypted, setIsDecrypted] = useState(false);

        useEffect(()=> {
            checkENS();
        },[])

        useEffect(()=>{
            if(props.index !== props.previousIndex && isDecrypted===true){
                hideMessage();
            }

        },[props.previousIndex])

        async function checkENS(){
            let recipientsTemp:any = []
            const recipientsFiltered = props.message.recipients.filter((recipient:any) => recipient != account)

            for(let recipient of recipientsFiltered) {
                let name = await library.lookupAddress(recipient);
                if(name !== null)
                {   
                    console.log("not null")
                    recipientsTemp = [...recipientsTemp, name];
                } else {
                    recipientsTemp = [...recipientsTemp, `${recipient.substring(0, 5)}...${recipient.substring(recipient.length - 4)}`];
                }
            }
            
            setRecipients(recipientsTemp)
        }

        async function decryptMessage() {
            const decryptedMessage = await decrypt(message)
            if(decryptedMessage) {
                setIsDecrypted(false);
                setMessage(decryptedMessage);
                setIsDecrypted(true);
                props.setPreviousIndex(props.index);
            }
        }

        async function hideMessage(){
            setMessage(encryptMessage);
            setIsDecrypted(false);
        }


    
        return (
            <ListItem sx ={{border:1, marginBottom:1}} disablePadding key={props.index}    secondaryAction={ 
                <IconButton className={`${(message != props.message.fetchedMessage.data) ? "list-item-btn" : ""}`}  
                        onClick={()=>{hideMessage()}}  edge="end" aria-label="comments">
                    { (message != props.message.fetchedMessage.data) ? <VisibilityOffIcon  />: null}
                </IconButton>  
            }
                className="messages-list-item"
            >
                <Tooltip 
                    title={(message === props.message.fetchedMessage.data) ? 
                    "Click to decrypt" : `Sender:${props.message.sender}`} 
                    placement="right">
                    <ListItemButton className="list-item-button"
                        onClick={() => {
                            if(message === props.message.fetchedMessage.data) {
                                decryptMessage()
                            }
                        }}>
                        <div>

                        </div>
                        <ListItemText
                        primary={
                        <>
                            <div className="message-left">
                                <div className="message-heading">
                                    <p><small>To: </small></p>
                                        <Stack direction="row" spacing={1}>
                                            {
                                                recipients.map((recipient: any) => {
                                                    console.log(recipients)
                                                    return (
                                                        <Chip
                                                            key={recipient}
                                                            color="primary"
                                                            label={recipient}
                                                            variant="outlined"
                                                        />
                                                    )
                                                })
                                            }
                                        </Stack>
                                    <p><small>{messageTime}</small></p>
                                </div>
                                <p className={`message 
                                        ${message === props.message.fetchedMessage.data ? 
                                        "message-overflow" : ""}` }
                                    dangerouslySetInnerHTML={{ __html: message }}>
                                </p>
                            </div>
                            {isDecrypted ? 
                                <div className="message-right">
                                    <div className="message-heading">
                                        <p><small>To: </small></p>
                                            <Stack direction="row" spacing={1}>
                                                {
                                                    recipients.map((recipient: any) => {
                                                        console.log(recipients)
                                                        return (
                                                            <Chip
                                                                key={recipient}
                                                                color="primary"
                                                                label={recipient}
                                                                variant="outlined"
                                                            />
                                                        )
                                                    })
                                                }
                                            </Stack>
                                        <p><small>{messageTime}</small></p>
                                    </div>
                                    <p className={`message ${message === props.message.fetchedMessage.data ? "message-overflow" : ""}` }
                                        dangerouslySetInnerHTML={{ __html: message }}>
                                    </p>
                                </div> : <></>}
                        </>
                        
                        }/>
                         
                    </ListItemButton>
                </Tooltip>
            </ListItem>
            )
    }

    function GetMessages() {
        const [fetchedMessages, setFetchedMessages] = useState<any>([]);
        const [previousIndex,setPreviousIndex] = useState<number>();

        useEffect(() => {
            processMessages()
        }, []);

        async function processMessages() {
            const deb0xContract = Deb0x(library, deb0xAddress)
            
            const sentMessages = await deb0xContract.fetchSentMessages(account)   
            console.log(sentMessages)

            const sentMessagesRetrieved = sentMessages.map(async function (item: any) {
                return { fetchedMessage: await fetchMessage(item.cid), recipients: item.recipients}
            })

            const messages = await Promise.all(sentMessagesRetrieved)

            setFetchedMessages(messages)
            setLoading(false)
        }

        if(!loading) {
            if (fetchedMessages.length == 0) {
                return (
                    <>
                        <div className="message-placeholder">
                            <MailOutlineIcon />
                            <Typography variant="h5"
                                gutterBottom
                                component="div"
                                sx={{marginLeft: .8, marginTop: 3}}
                            >
                                No messages yet.
                            </Typography>
                        </div>
                    </>
                )
            } else {
                return (
                    <Box sx={{ width: '100%', maxWidth: 1080, margin: '0 auto'}}>
                        <div className="row messages-list">
                            <List className="col-md-3 col-sm-12">
                                {fetchedMessages.map((message: any, i: any) => {
                                    return (
                                        <Message message={message} index={i} 
                                            key={i} previousIndex={previousIndex} 
                                            setPreviousIndex={setPreviousIndex} />
                                    )
                                })}
                            </List>
                            <Box className="intro-box sent col-md-9">
                                <div>
                                    <img src={empty} />
                                    <p>Open a message from the list to see the details.</p>
                                </div>
                            </Box>
                        </div>
                    </Box>
                )
            }
        } else {
            return (
                <div className="spinner">
                    <CircularProgress/>
                </div>
            )
        }

    }
    
    if(encryptionKeyInitialized == true){
        return (
            // sx={{display:"flex"}}
            <Box>
                <Box className="pagination" sx={{display:"flex"}}>
                    <Pagination count={1} showFirstButton showLastButton />
                    <IconButton size="large" onClick={()=> setLoading(true) }>
                        <RefreshIcon fontSize="large"/>
                    </IconButton>
                </Box>
                <Box>
                    <GetMessages />
                </Box>
            </Box>
           
        )
    } else if(encryptionKeyInitialized == false){
        return (
            <Stepper onDeboxInitialization={getPublicEncryptionKey}/>
        )
    } else{
        return(
            <div className="spinner">
                <CircularProgress/>
            </div>
        )
    }
}