import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, mergeMap, groupBy } from 'rxjs/operators';
import {
  EntitiesModel,
  Permission,
  B2BUser,
  normalizeHttpError,
} from '@spartacus/core';
import {
  UserGroupActions,
  PermissionActions,
  B2BUserActions,
} from '../actions/index';
import { normalizeListPage, serializeParams } from '../../utils/serializer';
import { UserGroup } from '../../model/user-group.model';
import { UserGroupConnector } from '../../connectors/user-group/user-group.connector';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable()
export class UserGroupEffects {
  @Effect()
  loadUserGroup$: Observable<
    UserGroupActions.LoadUserGroupSuccess | UserGroupActions.LoadUserGroupFail
  > = this.actions$.pipe(
    ofType(UserGroupActions.LOAD_USER_GROUP),
    map((action: UserGroupActions.LoadUserGroup) => action.payload),
    switchMap(({ userId, userGroupId }) => {
      return this.userGroupConnector.get(userId, userGroupId).pipe(
        map((userGroup: UserGroup) => {
          return new UserGroupActions.LoadUserGroupSuccess([userGroup]);
        }),
        catchError((error: HttpErrorResponse) =>
          of(
            new UserGroupActions.LoadUserGroupFail({
              userGroupId,
              error: normalizeHttpError(error),
            })
          )
        )
      );
    })
  );

  @Effect()
  loadUserGroups$: Observable<
    | UserGroupActions.LoadUserGroupsSuccess
    | UserGroupActions.LoadUserGroupSuccess
    | UserGroupActions.LoadUserGroupsFail
  > = this.actions$.pipe(
    ofType(UserGroupActions.LOAD_USER_GROUPS),
    map((action: UserGroupActions.LoadUserGroups) => action.payload),
    switchMap((payload) =>
      this.userGroupConnector.getList(payload.userId, payload.params).pipe(
        switchMap((userGroups: EntitiesModel<UserGroup>) => {
          const { values, page } = normalizeListPage(userGroups, 'uid');
          return [
            new UserGroupActions.LoadUserGroupSuccess(values),
            new UserGroupActions.LoadUserGroupsSuccess({
              page,
              params: payload.params,
            }),
          ];
        }),
        catchError((error: HttpErrorResponse) =>
          of(
            new UserGroupActions.LoadUserGroupsFail({
              params: payload.params,
              error: normalizeHttpError(error),
            })
          )
        )
      )
    )
  );

  @Effect()
  loadAvailableOrderApprovalPermissions$: Observable<
    | UserGroupActions.LoadPermissionsSuccess
    | PermissionActions.LoadPermissionSuccess
    | UserGroupActions.LoadPermissionsFail
  > = this.actions$.pipe(
    ofType(UserGroupActions.LOAD_USER_GROUP_PERMISSIONS),
    map((action: UserGroupActions.LoadPermissions) => action.payload),
    groupBy(({ userGroupId, params }) => serializeParams(userGroupId, params)),
    mergeMap((group) =>
      group.pipe(
        switchMap((payload) =>
          this.userGroupConnector
            .getAvailableOrderApprovalPermissions(
              payload.userId,
              payload.userGroupId,
              payload.params
            )
            .pipe(
              switchMap((permissions: EntitiesModel<Permission>) => {
                const { values, page } = normalizeListPage(permissions, 'code');
                return [
                  new PermissionActions.LoadPermissionSuccess(values),
                  new UserGroupActions.LoadPermissionsSuccess({
                    userGroupId: payload.userGroupId,
                    page,
                    params: payload.params,
                  }),
                ];
              }),
              catchError((error: HttpErrorResponse) =>
                of(
                  new UserGroupActions.LoadPermissionsFail({
                    userGroupId: payload.userGroupId,
                    params: payload.params,
                    error: normalizeHttpError(error),
                  })
                )
              )
            )
        )
      )
    )
  );

  @Effect()
  loadAvailableOrgCustomers$: Observable<
    | UserGroupActions.LoadAvailableOrgCustomersSuccess
    | B2BUserActions.LoadB2BUserSuccess
    | UserGroupActions.LoadAvailableOrgCustomersFail
  > = this.actions$.pipe(
    ofType(UserGroupActions.LOAD_USER_GROUP_AVAILABLE_CUSTOMERS),
    map((action: UserGroupActions.LoadAvailableOrgCustomers) => action.payload),
    groupBy(({ userGroupId, params }) => serializeParams(userGroupId, params)),
    mergeMap((group) =>
      group.pipe(
        switchMap((payload) =>
          this.userGroupConnector
            .getAvailableOrgCustomers(
              payload.userId,
              payload.userGroupId,
              payload.params
            )
            .pipe(
              switchMap((customers: EntitiesModel<B2BUser>) => {
                const { values, page } = normalizeListPage(
                  customers,
                  'customerId'
                );
                return [
                  new B2BUserActions.LoadB2BUserSuccess(values),
                  new UserGroupActions.LoadAvailableOrgCustomersSuccess({
                    userGroupId: payload.userGroupId,
                    page,
                    params: payload.params,
                  }),
                ];
              }),
              catchError((error: HttpErrorResponse) =>
                of(
                  new UserGroupActions.LoadAvailableOrgCustomersFail({
                    userGroupId: payload.userGroupId,
                    params: payload.params,
                    error: normalizeHttpError(error),
                  })
                )
              )
            )
        )
      )
    )
  );

  @Effect()
  createUserGroup$: Observable<
    | UserGroupActions.CreateUserGroupSuccess
    | UserGroupActions.CreateUserGroupFail
  > = this.actions$.pipe(
    ofType(UserGroupActions.CREATE_USER_GROUP),
    map((action: UserGroupActions.CreateUserGroup) => action.payload),
    switchMap((payload) =>
      this.userGroupConnector.create(payload.userId, payload.userGroup).pipe(
        map((data) => new UserGroupActions.CreateUserGroupSuccess(data)),
        catchError((error: HttpErrorResponse) =>
          of(
            new UserGroupActions.CreateUserGroupFail({
              userGroupId: payload.userGroup.uid,
              error: normalizeHttpError(error),
            })
          )
        )
      )
    )
  );

  @Effect()
  updateUserGroup$: Observable<
    // | UserGroupActions.UpdateUserGroupSuccess
    UserGroupActions.LoadUserGroup | UserGroupActions.UpdateUserGroupFail
  > = this.actions$.pipe(
    ofType(UserGroupActions.UPDATE_USER_GROUP),
    map((action: UserGroupActions.UpdateUserGroup) => action.payload),
    switchMap((payload) =>
      this.userGroupConnector
        .update(payload.userId, payload.userGroupId, payload.userGroup)
        .pipe(
          // TODO: Workaround for empty PATCH response:
          // map(data => new UserGroupActions.UpdateUserGroupSuccess(data)),
          map(() => new UserGroupActions.LoadUserGroup(payload)),
          catchError((error: HttpErrorResponse) =>
            of(
              new UserGroupActions.UpdateUserGroupFail({
                userGroupId: payload.userGroup.uid,
                error: normalizeHttpError(error),
              })
            )
          )
        )
    )
  );

  @Effect()
  deleteUserGroup$: Observable<
    | UserGroupActions.DeleteUserGroupSuccess
    | UserGroupActions.DeleteUserGroupFail
  > = this.actions$.pipe(
    ofType(UserGroupActions.DELETE_USER_GROUP),
    map((action: UserGroupActions.DeleteUserGroup) => action.payload),
    switchMap((payload) =>
      this.userGroupConnector.delete(payload.userId, payload.userGroupId).pipe(
        map((data) => new UserGroupActions.DeleteUserGroupSuccess(data)),
        catchError((error: HttpErrorResponse) =>
          of(
            new UserGroupActions.DeleteUserGroupFail({
              userGroupId: payload.userGroupId,
              error: normalizeHttpError(error),
            })
          )
        )
      )
    )
  );

  @Effect()
  assignPermissionToUserGroup$: Observable<
    | UserGroupActions.AssignPermissionSuccess
    | UserGroupActions.AssignPermissionFail
  > = this.actions$.pipe(
    ofType(UserGroupActions.USER_GROUP_ASSIGN_PERMISSION),
    map((action: UserGroupActions.AssignPermission) => action.payload),
    switchMap((payload) =>
      this.userGroupConnector
        .assignOrderApprovalPermission(
          payload.userId,
          payload.userGroupId,
          payload.permissionUid
        )
        .pipe(
          map(
            (data) =>
              new UserGroupActions.AssignPermissionSuccess({
                permissionUid: data.id,
                selected: data.selected,
              })
          ),
          catchError((error: HttpErrorResponse) =>
            of(
              new UserGroupActions.AssignPermissionFail({
                userGroupId: payload.userGroupId,
                permissionUid: payload.permissionUid,
                error: normalizeHttpError(error),
              })
            )
          )
        )
    )
  );

  @Effect()
  assignMemberUnitUserGroup$: Observable<
    UserGroupActions.AssignMemberSuccess | UserGroupActions.AssignMemberFail
  > = this.actions$.pipe(
    ofType(UserGroupActions.USER_GROUP_ASSIGN_MEMBER),
    map((action: UserGroupActions.AssignMember) => action.payload),
    switchMap((payload) =>
      this.userGroupConnector
        .assignMember(payload.userId, payload.userGroupId, payload.customerId)
        .pipe(
          map(
            () =>
              new UserGroupActions.AssignMemberSuccess({
                customerId: payload.customerId,
                selected: true,
              })
          ),
          catchError((error: HttpErrorResponse) =>
            of(
              new UserGroupActions.AssignMemberFail({
                userGroupId: payload.userGroupId,
                customerId: payload.customerId,
                error: normalizeHttpError(error),
              })
            )
          )
        )
    )
  );

  @Effect()
  unassignMemberFromUserGroup$: Observable<
    UserGroupActions.UnassignMemberSuccess | UserGroupActions.UnassignMemberFail
  > = this.actions$.pipe(
    ofType(UserGroupActions.USER_GROUP_UNASSIGN_MEMBER),
    map((action: UserGroupActions.UnassignMember) => action.payload),
    switchMap((payload) =>
      this.userGroupConnector
        .unassignMember(payload.userId, payload.userGroupId, payload.customerId)
        .pipe(
          map(
            () =>
              new UserGroupActions.UnassignMemberSuccess({
                customerId: payload.customerId,
                selected: false,
              })
          ),
          catchError((error: HttpErrorResponse) =>
            of(
              new UserGroupActions.UnassignMemberFail({
                userGroupId: payload.userGroupId,
                customerId: payload.customerId,
                error: normalizeHttpError(error),
              })
            )
          )
        )
    )
  );

  @Effect()
  unassignPermissionFromUserGroup$: Observable<
    | UserGroupActions.UnassignPermissionSuccess
    | UserGroupActions.UnassignPermissionFail
  > = this.actions$.pipe(
    ofType(UserGroupActions.USER_GROUP_UNASSIGN_PERMISSION),
    map((action: UserGroupActions.UnassignPermission) => action.payload),
    switchMap((payload) =>
      this.userGroupConnector
        .unassignOrderApprovalPermission(
          payload.userId,
          payload.userGroupId,
          payload.permissionUid
        )
        .pipe(
          map(
            (data) =>
              new UserGroupActions.UnassignPermissionSuccess({
                permissionUid: data.id,
                selected: data.selected,
              })
          ),
          catchError((error: HttpErrorResponse) =>
            of(
              new UserGroupActions.UnassignPermissionFail({
                userGroupId: payload.userGroupId,
                permissionUid: payload.permissionUid,
                error: normalizeHttpError(error),
              })
            )
          )
        )
    )
  );

  @Effect()
  unassignAllMembersFromUserGroup$: Observable<
    | UserGroupActions.UnassignAllMembersSuccess
    | UserGroupActions.UnassignAllMembersFail
  > = this.actions$.pipe(
    ofType(UserGroupActions.USER_GROUP_UNASSIGN_ALL_MEMBERS),
    map((action: UserGroupActions.UnassignAllMembers) => action.payload),
    switchMap((payload) =>
      this.userGroupConnector
        .unassignAllMembers(payload.userId, payload.userGroupId)
        .pipe(
          map(
            () =>
              new UserGroupActions.UnassignAllMembersSuccess({
                selected: false,
              })
          ),
          catchError((error: HttpErrorResponse) =>
            of(
              new UserGroupActions.UnassignAllMembersFail({
                userGroupId: payload.userGroupId,
                error: normalizeHttpError(error),
              })
            )
          )
        )
    )
  );

  constructor(
    private actions$: Actions,
    private userGroupConnector: UserGroupConnector
  ) {}
}
