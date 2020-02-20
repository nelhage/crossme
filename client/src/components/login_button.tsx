import React, { useEffect } from "react";

import Nav from "react-bootstrap/Nav";

import { Session, useCurrentUser } from "../user";

const CLIENT_ID =
  "226414555417-lu10riueco1dueh39t32dlvtffp0d0kf.apps.googleusercontent.com";
const LOGIN_ID = "btn-login-with-google";

export interface LoginButtonProps {
  setUser: (user: null | Session) => void;
}

export const LoginButton: React.FC<LoginButtonProps> = ({ setUser }) => {
  // const user = useCurrentUser();
  const onSignIn = (googleUser: gapi.auth2.GoogleUser) => {
    const profile = googleUser.getBasicProfile();
    setUser({
      type: "google",
      user_id: googleUser.getId(),
      name: profile.getName(),
      auth: googleUser.getAuthResponse()
    });
  };

  const renderButton = () => {
    gapi.load("auth2", () => {
      gapi.auth2
        .init({
          client_id: CLIENT_ID
        })
        .then(() => {
          gapi.signin2.render(LOGIN_ID, {
            scope: "profile email",
            width: 100,
            height: 30,
            longtitle: false,
            theme: "dark",
            onsuccess: onSignIn,
            onfailure: why => {
              console.log("login failed:", why);
            }
          });
        });
    });
  };

  useEffect(() => {
    if (window.gapi) {
      renderButton();
    } else {
      window.addEventListener("crossme.gapi.loaded", renderButton);
      return () => {
        window.removeEventListener("crossme.gapi.loaded", renderButton);
      };
    }
  });

  return (
    <Nav.Item>
      <div id={LOGIN_ID}></div>
    </Nav.Item>
  );
};
