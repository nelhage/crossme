import React, { useState, useEffect } from "react";

import Nav from "react-bootstrap/Nav";

import { useCurrentUser } from "../user";

const CLIENT_ID =
  "226414555417-lu10riueco1dueh39t32dlvtffp0d0kf.apps.googleusercontent.com";
const LOGIN_ID = "btn-login-with-google";

export interface LoginButtonProps {
  setUser: (user: null | gapi.auth2.GoogleUser) => void;
}

export const LoginButton: React.FC<LoginButtonProps> = ({ setUser }) => {
  // const user = useCurrentUser();
  const onSignIn = (googleUser: gapi.auth2.GoogleUser) => {
    console.log("logged in: %o", googleUser);
    console.log("profile: %o", googleUser.getBasicProfile());
    setUser(googleUser);
  };

  useEffect(() => {
    console.log("rendering google signin button");
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
  });

  return (
    <Nav.Item>
      <div id={LOGIN_ID}></div>
    </Nav.Item>
  );
};
