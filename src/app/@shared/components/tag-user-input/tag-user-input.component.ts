import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  Renderer2,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { environment } from 'src/environments/environment';
import { CommonService } from '../../services/common.service';

@Component({
  selector: 'app-tag-user-input',
  templateUrl: './tag-user-input.component.html',
  styleUrls: ['./tag-user-input.component.scss'],
})
export class TagUserInputComponent implements OnChanges, OnDestroy {
  @Input('value') value: string = '';
  @Input('placeholder') placeholder: string = 'ss';
  @Input('isShowMetaPreview') isShowMetaPreview: boolean = true;
  @Input('isAllowTagUser') isAllowTagUser: boolean = true;
  @Output('onDataChange') onDataChange: EventEmitter<any> =
    new EventEmitter<any>();

  @ViewChild('tagInputDiv', { static: false }) tagInputDiv: ElementRef;
  @ViewChild('userSearchDropdownRef', { static: false, read: NgbDropdown })
  userSearchNgbDropdown: NgbDropdown;

  ngUnsubscribe: Subject<void> = new Subject<void>();
  metaDataSubject: Subject<void> = new Subject<void>();

  userList: any = [];
  userNameSearch = '';
  metaData: any = {};
  apiUrl = environment.apiUrl + 'customers/';
  constructor(
    private renderer: Renderer2,
    private spinner: NgxSpinnerService,
    private commonService: CommonService
  ) {
    this.metaDataSubject.pipe(debounceTime(300)).subscribe(() => {
      this.getMetaDataFromUrlStr();
      this.checkUserTagFlag();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    const val = changes?.['value']?.currentValue;
    this.setTagInputDivValue(val);

    if (val === '') {
      this.clearUserSearchData();
      this.clearMetaData();
    } else {
      this.getMetaDataFromUrlStr();
      this.checkUserTagFlag();
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();

    this.metaDataSubject.next();
    this.metaDataSubject.complete();
  }

  messageOnKeyEvent(): void {
    this.metaDataSubject.next();
    this.emitChangeEvent();
  }

  checkUserTagFlag(): void {
    this.userList = [];
    if (this.isAllowTagUser) {
      let htmlText = this.tagInputDiv?.nativeElement?.innerHTML || '';
      const anchorTagRegex =
        /<a\s+href="\/settings\/view-profile\/(\d+)"\s+class="text-danger"\s+data-id="\d+">@([\w\s]+)<\/a>/g;
      htmlText = htmlText.replace(anchorTagRegex, '');

      const atSymbolRegex = /@/g;
      const matches = [...htmlText.matchAll(atSymbolRegex)];
      const cursorPosition = this.getCursorPosition();
      if (matches.length > 0) {
        let foundValidTag = false;
        for (const match of matches) {
          const atSymbolIndex = match.index;
          if (cursorPosition > atSymbolIndex) {
            let textAfterAt = htmlText
              .substring(atSymbolIndex + 1, cursorPosition)
              .trim();
            textAfterAt = textAfterAt.replace(/<[^>]*>/g, '');
            textAfterAt = textAfterAt.replace(/[^\w\s]/g, '');
            const currentPositionValue = textAfterAt.split(' ')[0].trim();
            if (currentPositionValue.length > 0) {
              this.userNameSearch = currentPositionValue;
              foundValidTag = true;
            }
          }
        }
        if (
          foundValidTag &&
          this.userNameSearch &&
          this.userNameSearch.length > 2
        ) {
          this.getUserList(this.userNameSearch);
        } else {
          this.clearUserSearchData();
        }
      }
    }
  }

  getCursorPosition(): number {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(this.tagInputDiv.nativeElement);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      return preCaretRange.toString().length;
    }
    return -1;
  }

  getMetaDataFromUrlStr(): void {
    const htmlText = this.tagInputDiv?.nativeElement?.innerHTML || '';
    const text = htmlText.replace(/<[^>]*>/g, '');
    // const matches = htmlText.match(/(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z0-9]{2,}(\.[a-zA-Z0-9]{2,})(\.[a-zA-Z0-9]{2,})?/gi);
    const matches = text.match(/(?:https?:\/\/|www\.)[^\s]+/g);
    const url = matches?.[0];
    if (url) {
      if (!url?.includes(this.metaData?.url)) {
        this.spinner.show();
        this.ngUnsubscribe.next();

        this.commonService
          .getMetaData({ url })
          .pipe(takeUntil(this.ngUnsubscribe))
          .subscribe({
            next: (res: any) => {
              if (res?.meta?.image) {
                const urls = res.meta?.image?.url;
                const imgUrl = Array.isArray(urls) ? urls?.[0] : urls;

                this.metaData = {
                  title: res?.meta?.title,
                  metadescription: res?.meta?.description,
                  metaimage: imgUrl,
                  metalink: res?.meta?.url || url,
                  url: url,
                };

                this.emitChangeEvent();
              }

              this.spinner.hide();
            },
            error: () => {
              this.clearMetaData();
              this.spinner.hide();
            },
          });
      }
    } else {
      this.clearMetaData();
    }
  }

  moveCursorToEnd(): void {
    const range = document.createRange();
    const selection = window.getSelection();
    range.setStart(
      this.tagInputDiv?.nativeElement,
      this.tagInputDiv?.nativeElement.childNodes.length
    );
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  selectTagUser(user: any): void {
    const htmlText = this.tagInputDiv?.nativeElement?.innerHTML || '';

    const savedRange = this.saveCursorPosition();
    const replaceUsernamesInTextNodesAtCursor = (
      html: string,
      userName: string,
      userId: string,
      displayName: string
    ) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const walk = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const cursorPosition = this.getCursorPosition();
          const regex = /@/g;
          const match = regex.exec(node.nodeValue || '');
          if (match && match.index <= cursorPosition) {
            const atSymbolIndex = match.index;
            const replacement = `<a href="/settings/view-profile/${userId}" class="text-danger" data-id="${userId}">@${displayName}</a>`;
            const beforeText = node.nodeValue?.substring(0, atSymbolIndex);
            const afterText = node.nodeValue?.substring(cursorPosition);
            const replacedText = `${beforeText}${replacement}${afterText}`;
            const span = document.createElement('span');
            span.innerHTML = replacedText;
            while (span.firstChild) {
              node.parentNode?.insertBefore(span.firstChild, node);
            }
            node.parentNode?.removeChild(node);
          }
        } else if (
          node.nodeType === Node.ELEMENT_NODE &&
          node.nodeName.toLowerCase() !== 'a'
        ) {
          node.childNodes.forEach((child) => walk(child));
        }
      };

      doc.body.childNodes.forEach((child) => walk(child));
      return doc.body.innerHTML;
    };
    const text = replaceUsernamesInTextNodesAtCursor(
      htmlText,
      this.userNameSearch,
      user?.Id,
      user?.Username.split(' ').join('')
    );
    this.setTagInputDivValue(text);
    this.restoreCursorPosition(savedRange);
    this.emitChangeEvent();
    this.moveCursorToEnd();
  }

  saveCursorPosition(): Range | null {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      return selection.getRangeAt(0).cloneRange();
    }
    return null;
  }

  restoreCursorPosition(savedRange: Range | null): void {
    if (savedRange) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(savedRange);
    }
  }

  getUserList(search: string): void {
    this.commonService
      .get(`${this.apiUrl}search-user?searchText=${search}`)
      .subscribe({
        next: (res: any) => {
          if (res?.data?.length > 0) {
            this.userList = res.data;
            this.userSearchNgbDropdown?.open();
          } else {
            this.clearUserSearchData();
          }
        },
        error: () => {
          this.clearUserSearchData();
        },
      });
  }

  clearUserSearchData(): void {
    this.userNameSearch = '';
    this.userList = [];
    this.userSearchNgbDropdown?.close();
  }

  clearMetaData(): void {
    this.metaData = {};
    this.emitChangeEvent();
  }

  setTagInputDivValue(htmlText: string): void {
    if (this.tagInputDiv) {
      this.renderer.setProperty(
        this.tagInputDiv.nativeElement,
        'innerHTML',
        htmlText
      );
    }
  }

  emitChangeEvent(): void {
    if (this.tagInputDiv) {
      // console.log(this.tagInputDiv);
      const htmlText = this.tagInputDiv?.nativeElement?.innerHTML;
      this.value = `${htmlText}`.replace(/\<div\>\<br\>\<\/div\>/gi, '');

      this.onDataChange.emit({
        html: htmlText,
        tags: this.tagInputDiv?.nativeElement?.children,
        meta: this.metaData,
      });
    }
  }
}
