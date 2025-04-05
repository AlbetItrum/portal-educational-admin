import React, { useState, useEffect } from "react";
import _ from "underscore";
import user from "libs/user/user";
import Button from "libs/Button";

import { Link, Outlet } from "react-router-dom";
import Smart from "libs/Smart";
import MyTable from "./MyTable";

function Layout2(props) {
  let [profile, setProfile] = useState(user.get_info());
  // useEffect(() => {
  //   window.user = user;
  // }, [])
 //console.log("*........ ## ROOT profileprofileprofileprofile", profile);

  // let v = useActionData();
  return (
    <div>
      <Smart
        obj={profile}
        items={[
          { type: "input", key: "first_name", label: "Имя", size: 6 },
          { type: "input", key: "surname", label: "Фамилия", size: 6 },
          { type: "input", key: "email", label: "Эл. почта", size: 6 },
          {
            type: "input",
            key: "plain_password",
            label: "Новый пароль",
            size: 6,
          },
          {
            size: 12,
            Component: () => {
              return (
                <div className={"mt-15"}>
                  Ваш юзер нейм для логина: <b>{profile.username}</b>
                </div>
              );
            },
          },
        ]}
        onChange={(v) => setProfile({ ...v })}
      ></Smart>
      <hr />
      <Button
        onClick={(scb, ecb) => {
          user.on_update(profile, scb, ecb);
        }}
      >
        Сохранить
      </Button>
      {/* <hr/>
      <MyTable
      ></MyTable> */}
    </div>
  );
}

export default Layout2;
