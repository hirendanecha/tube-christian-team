import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbActiveModal, NgbActiveOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { ShareService } from 'src/app/@shared/services/share.service';
import { CommonService } from 'src/app/@shared/services/common.service';
import { SocketService } from 'src/app/@shared/services/socket.service';

@Component({
  selector: 'app-notifications-modal',
  templateUrl: './notifications-modal.component.html',
  styleUrls: ['./notifications-modal.component.scss'],
})
export class NotificationsModalComponent implements OnInit {
  @Input() profileId: number;
  constructor(
    public sharedService: ShareService,
    private commonService: CommonService,
    private activeModal: NgbActiveModal,
    private activeOffcanvas: NgbActiveOffcanvas,
    private socketService: SocketService,
  ) {}

  ngOnInit(): void {
    this.sharedService.getNotificationList(this.profileId);
    this.socketService.readNotification({ profileId: this.profileId }, (data) => { });
  }

  readUnreadNotification(postId: string, notification): void {
    this.commonService.readUnreadNotification(notification.id, 'Y').subscribe({
      next: (res) => {
        // const url = `https://christian.team/post/${postId}`;
        // window.open(url, "_blank");
        // this.router.navigate([`post/${postId}`]);
        this.closeModal();
      },
    });
  }

  closeModal(): void {
    this.activeModal?.dismiss();
    this.activeOffcanvas?.dismiss();
  }
}
