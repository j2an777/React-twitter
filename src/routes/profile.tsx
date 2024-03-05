import styled from "styled-components";
import { auth, db, storage } from "../firebase"
import { useEffect, useState } from "react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { collection, getDocs, limit, orderBy, query, where, writeBatch } from "firebase/firestore";
import { ITweet } from "../components/timeline";
import Tweet from "../components/tweet";

const Wrapper = styled.div`
    display : flex;
    align-items : center;
    flex-direction : column;
    gap : 20px;
`;

const AvatarUpload = styled.label`
    width : 80px;
    overflow : hidden;
    height : 80px;
    border-radius : 50%;
    background-color : #1d9bf0;
    cursor : pointer;
    display : flex;
    justify-content : center;
    align-items : center;
    svg {
        width : 50px;
    }
`;

const AvatarImg = styled.img`
    width : 100%;
    height : 100%;
    object-fit : auto;
`;

const AvatarInput = styled.input`
    display : none;
`;

const AvatarContents = styled.div`
    display : flex;
    justify-content : center;
    align-items : center;
`;

const Name = styled.span`
    font-size : 22px;
`;

const NameEdit = styled.button`
    margin-left : 15px;
    background-color : transparent;
    border : 1px solid #ccc;
    border-radius : 15px;
    padding : 5px 10px;
    color : white;
    font-size : 16px;
    &:hover {
        cursor : pointer;
    }
`;

const Tweets = styled.div`
    display : flex;
    width : 100%;
    flex-direction : column;
    gap : 10px;
`;

const NameEditInput = styled.input`
    background-color : transparent !important;
    outline : none;
    color : white;
    border : none;
    width : 200px;
    border-bottom : 0.5px solid #ccc;
    padding : 5px 10px;
`;

export default function Profile() {

    const user = auth.currentUser;
    const [avatar, setAvatar] = useState(user?.photoURL);
    const [tweets, setTweets] = useState<ITweet[]>([]);
    const [editName, setEditName] = useState(false);
    const [editNValue, setEditNValue] = useState("");

    const onAvatarChange = async (e:React.ChangeEvent<HTMLInputElement>) => {
        const {files} = e.target;

        if (!user) return;

        if(files && files.length === 1) {
            const file = files[0];
            const locationRef = ref(storage, `avatars/${user?.uid}`);
            const result = await uploadBytes(locationRef, file);
            const avatarUrl = await getDownloadURL(result.ref);
            setAvatar(avatarUrl);
            await updateProfile(user, {
                photoURL: avatarUrl,
            });
        }
    };

    const fetchTweets = async () => {
        const tweetQuery = query(
            collection(db, "tweets"),
            where("userId", "==", user?.uid),
            orderBy("createdAt", "desc"),
            limit(25)
        );
        const snapshot = await getDocs(tweetQuery);
        const tweets = snapshot.docs.map(doc => {
            const {tweet, createdAt, userId, username, photo} = doc.data();
            return {
                tweet, createdAt, userId, username, photo,
                id: doc.id,
            };
        });
        setTweets(tweets);
    };

    useEffect(() => {
        fetchTweets();
    }, []);

    const onEditName = (e:React.FormEvent<HTMLInputElement>) => {
        setEditNValue(e.currentTarget.value);
    };

    const onChangeEditMode = () => {
        setEditName(!editName)
        setEditNValue("");
    };

    const onEditNameSubmit = async () => {
        if (!user || editNValue.length === 0) return;

        await updateProfile(user, {
            displayName: editNValue,
        });

        // tweets 컬렉션 내의 모든 문서에 대해 username 필드 업데이트
        const userTweetsQuery = query(
            collection(db, "tweets"),
            where("userId", "==", user?.uid),
        );

        const snapshot = await getDocs(userTweetsQuery);
        // 여러 문서 업데이트
        const batch = writeBatch(db);

        snapshot.docs.map((doc) => {
            const docRef = doc.ref; // 각 문서에 대한 참조
            batch.update(docRef, { username: editNValue }); // 필드 업데이트
        });

        await batch.commit(); // batch 작업 커밋

        setEditName(false);
        setEditNValue("");
        fetchTweets(); // 변경된 트윗 데이터를 다시 불러옴
    };

    return (
        <Wrapper>
            <AvatarUpload htmlFor="avatar">
                {avatar ? (
                    <AvatarImg src={avatar} />
                ) : (
                    <svg fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
                    </svg>
                )}
            </AvatarUpload>
            <AvatarInput 
                onChange={onAvatarChange} 
                id="avatar" 
                type="file" 
                accept="image/*" />
            <AvatarContents>
                {editName ? (
                    <NameEditInput 
                        type="text"
                        placeholder = "Edit to here. (press Enter)"
                        value = {editNValue}
                        onChange = {onEditName}
                        onKeyDown={(e) => e.key === 'Enter' && onEditNameSubmit()}
                    />
                ) : (
                    <Name>
                        {user?.displayName ?? "Anonymous"}
                    </Name>
                )}
                <NameEdit onClick={onChangeEditMode}>{ editName ? "변경 취소" : "닉네임 변경" }</NameEdit>
            </AvatarContents>
            <Tweets>
                    {tweets.map(tweet => <Tweet key={tweet.id} {...tweet} />)}
            </Tweets>
        </Wrapper>
    )
}