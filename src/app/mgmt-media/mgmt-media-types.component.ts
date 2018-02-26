import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

import { PermsComponent } from '../attrs/perms.component';
import { LocksComponent } from '../attrs/locks.component';
import { MaxesComponent } from '../attrs/maxes.component';

import { MediaTypeService } from '../media-type.service';
import { LocationService } from '../location.service';

import { Globals } from '../globals';

/* -------------------------------------- */
//The media-type list component at /types //
/* -------------------------------------- */

@Component({
  selector: 'app-mgmt-media-types',
  template: `
    <button routerLink="./new">New type</button>
    <p *ngIf="msg">{{msg}}</p>
    <ul>
      <li *ngFor="let mtype of globals.locMediaTypes; let i = index" routerLink="./{{mtype.name}}">
        {{mtype.name}}
        <span (click)="deleteType(mtype.name, i)">Ⓧ</span>
      </li>
    </ul>
  `,
  styleUrls: ['./mgmt-media-types.component.css'],
})
export class MgmtMediaTypesComponent {
  mtypes: any = [];
  msg: string = '';
  
  constructor(
    public globals: Globals,
    private mTypeService: MediaTypeService
  ) {}
  
  deleteType(name, i) {
    this.mTypeService.delete(name)
      .subscribe();
    this.globals.locMediaTypes.splice(i, 1);
  }
}

@Component({
  selector: 'app-media-type-detail',
  template: `
  <p>{{msg}}</p>
  <button (click)="location.back()">Go back</button>
  <h2>{{name}}</h2>
  Name:
  <br/>
  <input type="text" [value]="name" [(ngModel)]="name"/>
  <br/>
  Unit of length (e.g. "pages" or "minutes"):
  <br/>
  <input type="text" [value]="unit" [(ngModel)]="unit"/>
  <form name="media-type-information" (ngSubmit)="submit()">
     <app-maxes [arr]="maxArr" auxiliary></app-maxes>
     <input type="submit" value="Submit"/>
  </form>
  `,
  styles: ['']
})
export class MediaTypeDetailComponent implements OnInit {
  maxArr: any = [];
  initialName: string;
  name: string;
  unit: string;
  msg: string = '';
  
  @ViewChild(MaxesComponent) private maxes: MaxesComponent;
  
  constructor(
    public globals: Globals,
    public location: Location,
    private route: ActivatedRoute,
    private mTypeService: MediaTypeService
  ) {}
  
  ngOnInit() {
    this.initialName = this.name = this.route.snapshot.paramMap.get('name');
    if (this.initialName == 'new') {
      this.name = '';
      this.maxArr = null;
    } else {
      this.getInfo();
    }
  }
  
  getInfo() {
    this.mTypeService.info(this.name)
      .subscribe(
        resp => {
          this.maxArr = resp.type.maxes;
          this.unit = resp.type.unit;
        }
      );
  }
  
  submit() {
    var maxArr = {} // initialize to properly copy attrs to:
    for (let i in this.maxes.arr.names) { maxArr[i] = this.maxes.overrideArr.names[i]?this.maxes.overrideArr.names[i]:this.maxes.arr.names[i] }
    
    if (this.initialName == 'new') {
      this.mTypeService.add(maxArr, this.name, this.unit)
        .subscribe(_ => {this.initialName = this.name; this.msg = "Successfully created."}, err => this.msg = err.error?err.error:"Not allowed!")
      this.globals.locMediaTypes.push({name: this.name, maxes: maxArr}); // add to global list of media types as well
    } else {
      this.mTypeService.edit(this.initialName, maxArr, this.name, this.unit)
        .subscribe(
          _ => this.msg = "Successfully edited.",
          err => this.msg = err.error?err.error:"Not allowed!",
          () => this.mTypeService.all() // refresh global list of media types
                  .subscribe(res => this.globals.locMediaTypes = res.types.map((dict, _) => dict))
        );
    }
  }
}
