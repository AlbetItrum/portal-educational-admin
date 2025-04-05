import React, { useState, useEffect } from "react";
// import Popover from "@mui/material/Popover";
// import Typography from "@mui/material/Typography";
// import Button from "@mui/material/Button";
// import Menu from "./Menu";
// import AppBar from "@mui/material/AppBar";
// import Box from "@mui/material/Box";
// import Toolbar from "@mui/material/Toolbar";
// import IconButton from "@mui/material/IconButton";
// import MenuIcon from "@mui/icons-material/Menu";
import { Link } from "react-router-dom";
import user from "libs/user/user";
import SvgIcon from "@mui/material/SvgIcon";
import { iconsList } from "libs/IconsList";

function BasicPopover(props) {
  let [Comp, setComp] = useState(null);
  let [cd, setCd] = useState(0);
  window.onRerenderMenu = () => setCd(new Date().getTime())
  window.onRenderLeftMenu = (comp) => {
    try {
      setComp(comp);
    } catch(e) {

    }
  };
  let href = window.location.pathname;
  useEffect(() => {
    document.body.setAttribute("data-page-url", href);
    Comp && setComp(null);
  }, [href]);

  let isMenu = !Boolean(Comp);
  let logoImg = global?.env?.logoImg || {};
  return (
    <div className={"headerCont " + (isMenu ? '' : 'CoursesMenu')}>
      <div className="fixcont">
        {/* {href} */}
        <div className="menuLinks animChild2">
          {/* {new Date().getTime()} */}
          <Link to={"/main"} className={"ib mainLogo"}>
            {logoImg.main}
          </Link>
          {isMenu && (
            <div >
              {(global.CONFIG.header || []).map((it, ind) => {
                let isOk = it.isVisible ? it.isVisible(it) : true;
                if (!isOk) {
                  return <div key={ind}></div>
                }
                return (
                  <Link
                    to={it.url}
                    key={'ind' + ind}
                    className={href.indexOf(it.url) > -1 ? "activeMenu" : ""}
                  >
                    <div className="menuItemWrapper">
                      <div className="menuIconWrapper">
                        <SvgIcon
                          component={iconsList[it.url] || iconsList.cv}
                          viewBox="0 0 24 24"
                        />
                      </div>
                      <div>{it.name}</div>
                    </div>
                  </Link>
                );
              })}

              <a
                className={"ib exit"}
                onClick={() => {
                  user.logout();
                }}
              >
                <div className="menuItemWrapper">
                  <div className="exitIconWrapper">
                    <SvgIcon component={iconsList.exit} viewBox="0 0 24 24" />
                  </div>
                  <div>Выход</div>
                </div>
              </a>
            </div>
          )}
        </div>
        <div className={'wrapMenuEl'} style={{width: '100%'}}>
          {Comp}
        </div>
      </div>
    </div>
  );
}

const MemoFn = React.memo(
  (props) => {
    // return <div>menu</div>
   //console.log("compare props 1.0");
    return <BasicPopover {...props}></BasicPopover>;
  },
  (p1, p2) => {
   //console.log("compare props 2.0");
    return p1.href == p2.href;
  }
);
export default MemoFn;
