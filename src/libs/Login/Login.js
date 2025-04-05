import React from 'react'
import {withRouter, BrowserRouter} from 'react-router-dom'
import Button from '../Button/Button';
import http from './../http/http';
import user from './../user/user';
import websocket from './../websocket/websocket';
import styles from './login.css';
// import Tree from './Tree';

class Login extends React.Component {

  constructor(props) {
    super(props);
    this.env = window.env;
    this.state = {username: '', password: '', checked: true};
    // this.handleChange =
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);


  }

  handleChange(event) {
    let obj = {};
    obj[event.target.getAttribute('id')] = event.target.value;
    this.setState(obj);
  }

  handleSubmit(event) {
    // console.log('........ ## handle login');
    this.setState({error: null, loading: true});
    http.post('/auth/login', {username: this.state.username, password: this.state.password}, {wo_notify: true})
        .then(r => {
          // console.log('*........ ## rrrrrrrrr', r);
          user.handle_login_response(r);
          window.location.href = '/'
          // this.props.history.push('/')
        })
        .catch(e => {
          // console.log('*........ ## eeeeeeeee', e);
          // console.log('........ ## response', e);
          this.setState({loading: false, error: e.error || `Server didn't respond correctly`})
        });
    event.preventDefault();
  }

  render() {
    let Error = this.state.error ? (<div className="err userErr afade">
      {this.state.error}
    </div>) : null;
    let {opts} = this.props;
    return <>
      <div className="main-body login-body">
        <div className="login-container">
          <div className="page-container afade">
            <div className="page-content">
              <div className="content-wrapper">
                <form className="login-form" onSubmit={this.handleSubmit}>
                  <div className="auth-block afade-slow ">
                    {/*<Tree*/}
                    {/*  // selectedId={8}*/}
                    {/*  onClick={(nodeid) => {*/}
                    {/*    // console.log('*........ ## on select', nodeid);*/}
                    {/*  }}></Tree>*/}
                    {/*<img src="images/logo2.png" height="100" className="login-logo" alt="Floos Sign in Page"/>*/}
                    <h1 className="text-center">{global?.env?.logoImg?.login || this.env.login_title || '-'}</h1>
                    <div className="mt20">
                      <div className="form-group"><label className="c2 r pr5">Логин</label>
                        <div className="c10 l"><input className="form-control w100"
                                                      value={this.state.username}
                                                      id="username"
                                                      onChange={this.handleChange}
                                                      type="text" placeholder="Login"/>
                        </div>
                      </div>
                      <div className="form-group"><label className="c2 r pr5">Пароль</label>
                        <div className="c10 l"><input type="password"
                                                      id="password"
                                                      value={this.state.password}
                                                      onChange={this.handleChange}
                                                      className="form-control w100"
                                                      placeholder="Password"/>
                        </div>
                      </div>
                      <div className="form-group mt10">
                        <div className="c10">

                        </div>
                        <div className="c2 l">
                          <div className="w100" style={{minHeight: '19px'}}>
                            <Button type="submit"

                                    className="pull-right" disabled={!this.state.checked || this.state.loading}>Вход</Button>

                          </div>
                        </div>
                        <div className="c12 tc">
                            {Error}
                        </div>
                        <div className="c12 tc" style={{fontSize: '14px'}}>
                        <hr/>
                          <div className="ib">
                            <input type="checkbox" className="checkbox" checked={this.state.checked} id="checkboxPrivate" onChange={(v) => {
                              console.log("qqqqq on changeeeeeeeeeeeeeeeeeeeeeeeeee", v);
                              this.setState({checked: !this.state.checked})
                            }}/>
                          </div>
                          Нажимая на кнопку, я соглашаюсь с <a href="https://itk.academy/files/personal.pdf" target="_blank"><u>Политикой
                            конфиденциальности</u></a>
                        </div>

                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  }
}

// global.Login = withRouter(Login);

export default Login
