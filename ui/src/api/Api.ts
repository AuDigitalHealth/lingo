// import useUserStore from '../stores/UserStore';
// import { UserState } from '../types/user';

// export class Api {

//     public static async checkAuthenticationStatus() : Promise<UserState> {
//         const res = this.request('/api');
//         return res;
//     }

//     private static request(method: string) : Function{

//         return ( url : string, body : Object ) => {
//             const requestOptions : Headers = {
//                 method,
//                 headers: this.headers( url )
//             };

//             if( body ){
//                 requestOptions.headers['Content-Type'] = 'application/json';
//                 requestOptions.body = JSON.stringify(body);
//             }
//             return fetch( url, requestOptions ).then( this.handleResponse );
//         }
//     }

//     private static headers( url:string ){
//         const userStore = useUserStore();

//         // could be useful

//         if( false ){

//         } else {
//             return {};
//         }
//     }

//     private static handleResponse( response: Response ){
//         return response.text().then(text => {
//             const data = text && JSON.parse(text);

//             if (!response.ok) {
//                 const userStore = useUserStore();
//                 if ([401, 403].includes(response.status) && userStore.email !== null ) {
//                     // auto logout if 401 Unauthorized or 403 Forbidden response returned from api
//                     userStore.logout();
//                 }

//                 const error = (data && data.message) || response.statusText;
//                 return Promise.reject(error);
//             }

//             return data;
//         });
//     }
// }
