import { Component, OnInit } from '@angular/core';

@Component({
  templateUrl: './templates-page.component.html',
  styleUrls: ['./templates-page.component.scss']
})
export class TemplatesPageComponent implements OnInit {
    testitems = Array.from({length: 100000}).map(item => {
      return {
        info:Math.random()
      }
    });

  constructor() { }

  ngOnInit(): void {
  }

}
