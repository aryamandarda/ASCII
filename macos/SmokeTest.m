#import <Cocoa/Cocoa.h>
#import <ScreenSaver/ScreenSaver.h>
#import <WebKit/WebKit.h>

static BOOL done = NO;
static int result = 1;
static int polls = 0;
static double firstEpoch = 0;
static CFAbsoluteTime firstObserved = 0;
static ScreenSaverView *testedSaver;

static void poll(WKWebView *view) {
    NSString *script = @"(()=>{const c=document.getElementById('art');return c&&c.dataset.frame?{frame:+c.dataset.frame,epoch:+c.dataset.epoch,speed:+c.dataset.speed,weather:c.dataset.weatherMode,people:+c.dataset.people,uiHidden:getComputedStyle(document.getElementById('likeWidget')).display==='none'&&getComputedStyle(document.getElementById('controls')).display==='none'&&getComputedStyle(document.getElementById('immerse')).display==='none'}:{ready:document.readyState,error:c?.dataset.error||'',text:document.body?.innerText||'',hidden:document.hidden}})()";
    [view evaluateJavaScript:script completionHandler:^(id value, NSError *error) {
        if (done) return;
        if (++polls % 10 == 0) NSLog(@"WebKit observation: %@ error: %@", value, error);
        if ([value isKindOfClass:NSDictionary.class] && [value[@"error"] length] > 0) { NSLog(@"FAIL renderer: %@", value); done = YES; return; }
        if (!error && [value isKindOfClass:NSDictionary.class] && [value[@"frame"] intValue] > 2) {
            if ([value[@"speed"] intValue] != 1 || ![value[@"weather"] isEqual:@"natural"] || ![value[@"uiHidden"] boolValue]) {
                NSLog(@"FAIL configuration: %@", value); done = YES; return;
            }
            if (!firstEpoch) { firstEpoch = [value[@"epoch"] doubleValue]; firstObserved = CFAbsoluteTimeGetCurrent(); }
            NSBitmapImageRep *pixels = [testedSaver bitmapImageRepForCachingDisplayInRect:testedSaver.bounds];
            [testedSaver cacheDisplayInRect:testedSaver.bounds toBitmapImageRep:pixels];
            BOOL colored = NO;
            for (NSInteger y=0; y<pixels.pixelsHigh; y+=32) for (NSInteger x=0; x<pixels.pixelsWide; x+=32) {
                NSColor *color = [[pixels colorAtX:x y:y] colorUsingColorSpace:NSColorSpace.deviceRGBColorSpace];
                CGFloat high = MAX(color.redComponent, MAX(color.greenComponent, color.blueComponent));
                CGFloat low = MIN(color.redComponent, MIN(color.greenComponent, color.blueComponent));
                if (high - low > .15 && high > .3) colored = YES;
            }
            if (CFAbsoluteTimeGetCurrent() - firstObserved >= 20 && [value[@"epoch"] doubleValue] > firstEpoch + 30000 && [[testedSaver valueForKey:@"presentedFrames"] intValue] > 5 && colored) {
                NSLog(@"PASS offline WebKit animation: %@", value); result = 0; done = YES; return;
            }
        }
        dispatch_after(dispatch_time(DISPATCH_TIME_NOW, NSEC_PER_SEC), dispatch_get_main_queue(), ^{ poll(view); });
    }];
}
int main(int argc, const char *argv[]) {
    @autoreleasepool {
        if (argc != 2) return 2;
        [NSApplication sharedApplication];
        [NSApp setActivationPolicy:NSApplicationActivationPolicyRegular];
        [NSApp finishLaunching];
        NSBundle *bundle = [NSBundle bundleWithPath:[[NSString stringWithUTF8String:argv[1]] stringByStandardizingPath]];
        Class principal = bundle.principalClass;
        if (!principal || ![principal isSubclassOfClass:ScreenSaverView.class]) { NSLog(@"FAIL loading saver bundle"); return 1; }
        NSRect frame = NSMakeRect(0,0,960,640);
        NSWindow *window = [[NSWindow alloc] initWithContentRect:frame styleMask:NSWindowStyleMaskBorderless backing:NSBackingStoreBuffered defer:NO];
        ScreenSaverView *saver = [[principal alloc] initWithFrame:frame isPreview:YES];
        testedSaver = saver;
        window.contentView = saver;
        [window makeKeyAndOrderFront:nil];
        [NSApp activate];
        [saver startAnimation];
        WKWebView *web = [saver valueForKey:@"webView"];
        if (!web) return 1;
        // Model the failure mode: the visible output must not depend on WebKit's
        // composited layer or its background requestAnimationFrame scheduler.
        if (web.alphaValue != 0) { NSLog(@"FAIL: production WebKit surface is visible"); return 1; }
        poll(web);
        NSDate *deadline = [NSDate dateWithTimeIntervalSinceNow:120];
        while (!done && deadline.timeIntervalSinceNow > 0) {
            NSEvent *event = [NSApp nextEventMatchingMask:NSEventMaskAny untilDate:[NSDate dateWithTimeIntervalSinceNow:0.1] inMode:NSDefaultRunLoopMode dequeue:YES];
            if (event) [NSApp sendEvent:event];
            [NSApp updateWindows];
            [saver animateOneFrame];
        }
        [saver stopAnimation];
        if ([saver valueForKey:@"webView"] != nil) result = 1;
        [window orderOut:nil];
        if (!done) NSLog(@"FAIL WebKit startup/animation timed out");
        return result;
    }
}
