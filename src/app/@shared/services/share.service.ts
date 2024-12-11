import { Injectable } from '@angular/core';
import { CommonService } from './common.service';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ShareService {
  isSidebarOpen: boolean = true;
  isDarkTheme: boolean = false;
  userDetails: any = {};
  channelData: any = {};
  notificationList: any = [];
  userChannelName: string;
  isUserAuthenticated: Subject<boolean> = new BehaviorSubject<boolean>(false);
  public _credentials: any = {};
  private mediaApprovedSubject = new BehaviorSubject<boolean>(false);
  mediaApproved$ = this.mediaApprovedSubject.asObservable();

  originalFavicon: HTMLLinkElement;
  private isNotifySubject = new BehaviorSubject<boolean>(false);
  isNotify$ = this.isNotifySubject.asObservable();

  constructor(
    private commonService: CommonService,
    private authService: AuthService
  ) {
    const theme = localStorage.getItem('theme');
    this.isDarkTheme = theme === 'dark';
    // this.isDarkTheme = !(theme === 'dark');
    this.toggleTheme();

    const sidebar = localStorage.getItem('sidebar');
    this.isSidebarOpen = sidebar === 'open';
    this.originalFavicon = document.querySelector('link[rel="icon"]');
    window.addEventListener('storage', this.onStorageChange.bind(this));
  }

  openSidebar(): void {
    this.isSidebarOpen = true;
    localStorage.setItem('sidebar', 'open');
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
    localStorage.setItem('sidebar', 'close');
  }

  toggleSidebar(): void {
    if (this.isSidebarOpen) {
      this.closeSidebar();
    } else {
      this.openSidebar();
    }
  }

  toggleTheme(): void {
    if (this.isDarkTheme) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
      this.isDarkTheme = false;
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
      this.isDarkTheme = true;
    }
  }

  // toggleTheme(): void {
  //   if (this.isDarkTheme) {
  //     document.body.classList.remove('dark-theme');
  //     localStorage.setItem('theme', 'light');
  //     this.isDarkTheme = false;
  //   } else {
  //     document.body.classList.add('dark-theme');
  //     localStorage.setItem('theme', 'dark');
  //     this.isDarkTheme = true;
  //   }
  // }

  scrollToTop(): void {
    window.scroll({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }

  updateMediaApproved(value: boolean) {
    this.mediaApprovedSubject.next(value);
  }

  getUserDetails(id: any): void {
    // const id = this.authService.getUserData()?.profileId
    const url = environment.apiUrl + `customers/profile/${id}`;
    this.commonService.get(url).subscribe({
      next: (res: any) => {
        // localStorage.setItem('authUser', JSON.stringify(res.data[0]));
        this.userDetails = res.data[0];
        const mediaApproved = res.data[0].MediaApproved === 1;
        this.updateMediaApproved(mediaApproved);
        // console.log(this.userDetails);
        this.authService.getLoginUserDetails(this.userDetails);
        this.getChannelByUserId(this.userDetails?.channelId);
      },
      error: (error) => {
        console.log(error);
      },
    });
  }
  getNotificationList(id) {
    const data = {
      page: 1,
      size: 20,
    };
    this.commonService.getNotificationList(parseInt(id), data).subscribe({
      next: (res: any) => {
        // localStorage.setItem('isRead', 'Y');
        this.setNotify(false);
        this.notificationList = res?.data;
      },
      error: (error) => {
        console.log(error);
      },
    });
  }

  getChannelByUserId(value): void {
    const url = environment.apiUrl;
    this.commonService.get(`${url}channels/get/${value}`).subscribe({
      next: (res) => {
        // console.log(res[0]?.id)
        if (res[0]) {
          this.channelData = res[0];
          this.userChannelName = this.channelData.firstname;
          localStorage.setItem('channelId', res[0]?.id);
          // console.log(this.channelData.firstname);
        }
      },
      error: (error) => {
        console.log(error);
      },
    });
  }

  getCredentials(): any {
    // this._credentials =
    //   this.authService.getUserData() || null;
    const token = this.authService.getToken();
    const isAuthenticate = token ? true : false;
    this.changeIsUserAuthenticated(isAuthenticate);
    return isAuthenticate;
  }

  changeIsUserAuthenticated(flag: boolean = false) {
    this.isUserAuthenticated.next(flag);
  }

  private onStorageChange(event: StorageEvent) {
    if (event.key === 'isRead') {
      this.setNotify(event.newValue === 'Y');
    }
  }

  setNotify(value: boolean): void {
    if (value) {
      localStorage.setItem('isRead', 'Y');
      this.originalFavicon.href = '/assets/img/icon-unread.jpg';
    } else {
      localStorage.setItem('isRead', 'N');
      this.originalFavicon.href = '/assets/img/favicon.png';
    }
    this.isNotifySubject.next(value);
  }
}
