import { Component, Input, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { CommonService } from '../../services/common.service';

@Component({
  selector: 'app-video-slider-list',
  templateUrl: './video-slider-list.component.html',
  styleUrls: ['./video-slider-list.component.scss'],
})
export class VideoSliderListComponent implements OnInit {
  // @Input() imageUrl!: string;
  // @Input() videoTime!: string;
  // @Input() videoTitle!: string;
  // @Input() views!: string;
  @Input() videoList: any;

  advertisementDataList: any[] = [];

  constructor(private router: Router, private commonService: CommonService) {}

  ngOnInit(): void {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        window.scrollTo(0, 0);
      }
    });
    this.getadvertizements();
  }

  openDetailPage(video: any): void {
    this.router.navigate([`video/${video.id}`], {
      state: { data: video },
    });
  }

  stripTags(html: string): string {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.innerText;
  }


  getadvertizements(): void {
    this.commonService.getAdvertisement().subscribe({
      next: (res: any) => {
        this.advertisementDataList = res;
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  trackByPostId(index: number, post: any): number | string {
    return post.id;
  }
}
