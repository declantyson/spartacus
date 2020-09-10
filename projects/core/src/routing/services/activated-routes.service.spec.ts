import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterEvent,
} from '@angular/router';
import { Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { ActivatedRoutesService } from './activated-routes.service';

describe('ActivatedRoutesService', () => {
  let service: ActivatedRoutesService;
  let router: Router;
  let mockRouterEvents$: Subject<RouterEvent>;

  beforeEach(() => {
    mockRouterEvents$ = new Subject<RouterEvent>();

    class MockRouter implements Partial<Router> {
      events = mockRouterEvents$;
      routerState = { snapshot: { root: {} } } as any;
    }

    TestBed.configureTestingModule({
      providers: [
        {
          provide: Router,
          useClass: MockRouter,
        },
      ],
    });
    service = TestBed.inject(ActivatedRoutesService);
    router = TestBed.inject(Router);
  });

  afterEach(() => mockRouterEvents$.complete());

  describe(`routes$`, () => {
    it('should emit on subscription', async () => {
      expect(await service.routes$.pipe(take(1)).toPromise()).toEqual([
        router.routerState.snapshot.root,
      ]);
    });

    it('should emit on every NavigationEnd event', async () => {
      const results = [];
      service.routes$.subscribe((res) => results.push(res));
      expect(results.length).toBe(1);
      mockRouterEvents$.next(new NavigationEnd(null, null, null));
      expect(results.length).toBe(2);
    });

    it('should not emit on other Navigation events', async () => {
      const results = [];
      service.routes$.subscribe((res) => results.push(res));
      expect(results.length).toBe(1);
      mockRouterEvents$.next(new NavigationStart(null, null, null));
      mockRouterEvents$.next(new NavigationCancel(null, null, null));
      mockRouterEvents$.next(new NavigationError(null, null, null));
      expect(results.length).toBe(1);
    });

    it('should emit array of activated routes', async () => {
      const mockRootActivatedRoute: Partial<ActivatedRouteSnapshot> = {
        firstChild: <ActivatedRouteSnapshot>{
          component: 'parent',
          firstChild: <ActivatedRouteSnapshot>{
            component: 'child',
            firstChild: null,
          },
        },
      };
      spyOnProperty(router.routerState.snapshot, 'root').and.returnValue(
        mockRootActivatedRoute
      );

      expect(await service.routes$.pipe(take(1)).toPromise()).toEqual([
        mockRootActivatedRoute,
        mockRootActivatedRoute.firstChild,
        mockRootActivatedRoute.firstChild.firstChild,
      ]);
    });
  });
});
