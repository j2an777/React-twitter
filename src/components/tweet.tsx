import React, { useState } from 'react'
import { ITweet } from './timeline'
import styled from 'styled-components'
import { auth, db, storage } from '../firebase';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';

const Wrapper = styled.div`
    display : grid;
    grid-template-columns : 3fr 1fr;
    padding : 20px;
    border : 1px solid rgba(255, 255, 255, 0.5);
    border-radius : 15px;
`;

const Column = styled.div``;

const Photo = styled.img`
    width : 100px;
    height : 100px;
    border-radius : 15px;
`;

const Username = styled.span`
    font-weight : 600;
    font-size : 15px;
`;

const Payload = styled.p`
    margin : 10px 0px;
    font-size : 18px;
`;

const DeleteButton = styled.button`
    background-color : tomato;
    color : white;
    font-weight : 600;
    border : 0;
    font-size : 12px;
    padding : 5px 10px;
    text-transform : uppercase;
    cursor : pointer;
    border-radius : 5px;
    transition : all 0.3s ease;
    &:hover {
        opacity : 0.8;
    }
`;

const EditButton = styled.button`
    background-color : #1d9bf0;
    color : white;
    font-weight : 600;
    border : 0;
    font-size : 12px;
    padding : 5px 10px;
    text-transform : uppercase;
    cursor : pointer;
    border-radius : 5px;
    margin-left : 10px;
    transition : all 0.3s ease;
    &:hover {
        opacity : 0.8;
    }
`;

const PopupForm = styled.form`
    position: fixed;
    top : 50%;
    left : 50%;
    transform : translate(-50%, -50%);
    width : 300px;
    padding : 20px;
    background-color : white;
    border-radius : 15px;
    box-shadow : 0px 0px 20px rgba(0, 0, 0, 0.1);
    display : flex;
    flex-direction : column;
    gap : 10px;
    z-index : 10;
`;

const EditInput = styled.input`
    padding : 10px;
    margin-bottom : 10px;
    border-radius : 5px;
    border : 1px solid #ccc;
    outline : none;
`;

const EditFile = styled.input`
    display : none;
`;

const OutButtonContainer = styled.div`
    display : flex;
    justify-content : flex-end;
`;

const OutButton = styled.button`
    background-color : transparent;
    color : black;
    width : 10px;
    font-weight : 600;
    border : 0;
    font-size : 16px;
    margin : 0;
    padding : 0;
    text-transform : uppercase;
    cursor : pointer;
`;

const EditFileButton = styled.label`
    padding : 10px;
    margin-bottom : 10px;
    border-radius : 5px;
    border : 1px solid #ccc;
    color : #888;
    text-align : center;
    &:hover {
        color : #333;
        cursor : pointer;
    }
    transition : all 0.3s ease;
`;

const EditSubmitButton = styled.input`
    background-color : #1d9bf0;
    color : white;
    width : 100%;
    border : none;
    padding : 10px 0px;
    border-radius : 15px;
    font-size : 16px;
    cursor : pointer;
    &:hover,
    &:active {
        opacity : 0.8;
    }
    transition : all 0.3s ease;
`;

export default function Tweet({ username, photo, tweet, userId, id }:ITweet) {

    const user = auth.currentUser;
    const [isEditLoading, setEditLoading] = useState(false);
    const [onEdit, setOnEdit] = useState(false);
    const [editValue, setEditValue] = useState("");
    const [editFile, setEditFile] = useState<File | null>(null);

    const onDelete = async () => {
        const ok = confirm("Are you sure you want to delete this tweet?");

        if(!ok || user?.uid !== userId) return;
        try {
            await deleteDoc(doc(db, "tweets", id));
            if(photo) {
                const photoRef = ref(storage, `tweets/${user.uid}/${id}`);
                await deleteObject(photoRef);
            }
        } catch (e) {
            console.log(e);
        } finally {
            //
        }
    };

    const onEditClick = () => {
        setOnEdit(true);
    };

    const onEditChange = (e: React.FormEvent<HTMLInputElement>) => {
        setEditValue(e.currentTarget.value);
    };

    const onEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {files} = e.target;
        if (files && files.length === 1) {
            setEditFile(files[0]);
        }
    };

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setEditLoading(true);
        const editOk = confirm("Are you sure you want to edit this file?");

        if(!editOk || user?.uid !== userId) return;

        let newPhotoURL = photo;

        try {
            if(editFile) {
                const editPhotoRef = ref(storage, `tweets/${user.uid}/${id}`);
                const uploadResult = await uploadBytes(editPhotoRef, editFile);
                newPhotoURL = await getDownloadURL(uploadResult.ref);
            }

            await updateDoc(doc(db, "tweets", id), {
                tweet: editValue,
                photo: newPhotoURL,
            });

        } catch (error) { 
            console.log(error);
        } finally {
            setOnEdit(false);
            setEditLoading(false);
            setEditValue("");
            setEditFile(null);
        } 
    };

    return (
      <Wrapper>
            <Column>
                <Username>{username}</Username>
                <Payload>{tweet}</Payload>
                {user?.uid === userId ? <DeleteButton onClick={onDelete}>Delete</DeleteButton> : null }
                {user?.uid === userId ? <EditButton onClick={onEditClick}>Edit</EditButton> : null}
            </Column>
            <Column>
                {photo ? (
                    <Photo src={photo} />        
                ) : null}
            </Column>
            {onEdit && (
                <PopupForm onSubmit={onSubmit}>
                    <OutButtonContainer>
                        <OutButton onClick={() => { setOnEdit(false); }}>X</OutButton>
                    </OutButtonContainer>
                    <EditInput
                        type='text'
                        placeholder='Edit your tweet'
                        value={editValue}
                        onChange={onEditChange}>
                    </EditInput>
                    <EditFileButton htmlFor="editFile">{editFile ? "Photo Edited ✅" : "Edit Photo"}</EditFileButton>
                    <EditFile
                        onChange={onEditFileChange}
                        type='file'
                        id="editFile"
                        accept='image/*'></EditFile>
                    <EditSubmitButton
                        type="submit"
                        value={isEditLoading ? "Posting..." : "Submit"}></EditSubmitButton>
                </PopupForm>
            )}
      </Wrapper>
    )
}
