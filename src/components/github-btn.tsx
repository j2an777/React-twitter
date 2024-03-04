import { GithubAuthProvider, signInWithPopup } from 'firebase/auth';
import styled from 'styled-components'
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

const Button = styled.button`
    width : 100%;
    background-color : white;
    font-weight : 600;
    color : black;
    padding : 10px 20px;
    border-radius : 50px;
    border : 0;
    display : flex;
    gap : 5px;
    align-items : center;
    justify-content : center;

    &:hover {
        cursor : pointer;
    }
`;

const Logo = styled.img`
    height : 25px;
`;
export default function GithubBtn() {
    const navigate = useNavigate();

    const onClick = async () => {
        try {
            const provider = new GithubAuthProvider();
            await signInWithPopup(auth, provider);
            navigate("/");
        } catch (error) {
            console.log(error);
        }
    };

    return (
      <Button onClick={onClick}>
          <Logo src="/github-btn.svg" />
          Continue with Github
      </Button>
    )
}
