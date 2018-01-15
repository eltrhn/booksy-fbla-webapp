import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

import { LocationService } from '../location.service';
import { RoleService } from '../role.service';

import { Globals } from '../globals';

@Component({
  selector: 'app-member-acct-info',
  templateUrl: './member-acct-info.component.html',
  styleUrls: ['./member-acct-info.component.css']
})
export class MemberAcctInfoComponent implements OnInit {
  msg: string;
  uID: string;
  member: any;
  roles: any[] = [];
  
  constructor(
    public location: Location,
    public globals: Globals,
    private route: ActivatedRoute,
    private roleService: RoleService,
    private locationService: LocationService
  ) {}

  ngOnInit() {
    this.uID = this.route.snapshot.paramMap.get('uID');
    this.roleService.getAll()
      .subscribe(res => this.roles = res.roles.sort((a, b) => a.name.localeCompare(b.name)));
    if (this.uID == 'new') {
      this.makeInfo();
    } else {
      this.getInfo();
    }
  }
  
  checkValid(): boolean {
    let m = this.member;
    // I Do Not Understand why the below is necessary and chaining && doesn't work
    // (I guess this is prettier than && chaining though)
    return [m.username, m.name, m.rid, this.uID=='new'?m.password:true].every(n => n);
  }
  
  getInfo() {
    this.locationService.getMemberInfo(this.uID)
      .subscribe(resp => this.member = resp.member);
  }
  
  makeInfo() {
    this.member = {
      perms: {
        raw: 0
      },
      user_id: null,
      username: null,
      name: null,
      rid: null,
      rolename: null,
      manages: false,
      recent: null,
      password: null,
    }
  }
  
  submit() {
    if (this.uID == 'new') {
      this.locationService.createMember(this.member)
        .subscribe(resp => this.location.back(), err => this.msg = err.error?err.error:'Error.');
    } else {
      this.locationService.editMember(this.member)
        .subscribe(resp => this.msg = 'Successfully edited.', err => this.msg = err.error?err.error:'Error.');
    }
  }
  
  removeMember() {
    this.locationService.removeMember(this.member.user_id)
      .subscribe(resp => this.location.back(), err => this.msg = err.error?err.error:'Error.')
  }

}

