const loginUrl = 'https://christian.team/login';
const logoutUrl = 'https://christian.team/logout';
const frontendUrl = 'https://tube.christian.team/';
const backendUrl =  'https://api.christian.team/';

// const frontendUrl = 'http://localhost:4200/';
// const backendUrl = 'http://localhost:8080/';
// const loginUrl = 'http://localhost:4200/login';
const wasabiUrl = 'https://s3.us-east-1.wasabisys.com/christian-team'


export const environment = {
  production: false,
  frontendUrl: frontendUrl,
  backendUrl: backendUrl,
  loginUrl: loginUrl,
  apiUrl: `${backendUrl}api/v1/`,
  domain: '.christian.team',
  wasabiUrl: wasabiUrl,
  socketUrl: `${backendUrl}`,
  conferenceUrl: 'https://meet.facetime.tube/',
  logoutUrl: logoutUrl

};

