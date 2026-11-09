#import <Cocoa/Cocoa.h>
#import <ScreenSaver/ScreenSaver.h>
#import <WebKit/WebKit.h>

static BOOL done = NO;
static int result = 1;
static double firstEpoch = 0;
static CFAbsoluteTime firstObserved = 0;

static void poll(WKWebView *view) {
    NSString *script = @"(()=>{const c=document.getElementById('art');return c&&c.dataset.frame?{frame:+c.dataset.frame,epoch:+c.dataset.epoch,speed:+c.dataset.speed,weather:c.dataset.weatherMode,people:+c.dataset.people,uiHidden:getComputedStyle(document.getElementById('likeWidget')).display==='none'&&getComputedStyle(document.getElementById('controls')).display==='none'&&getComputedStyle(document.getElementById('immerse')).display==='none'}:null})()";
    [view evaluateJavaScript:script completionHandler:^(id value, NSError *error) {
        if (done) return;
        if (!error && [value isKindOfClass:NSDictionary.class] && [value[@"frame"] intValue] > 2) {
            if ([value[@"speed"] intValue] != 1 || ![value[@"weather"] isEqual:@"natural"] || ![value[@"uiHidden"] boolValue]) {
                NSLog(@"FAIL configuration: %@", value); done = YES; return;
            }
            if (!firstEpoch) { firstEpoch = [value[@"epoch"] doubleValue]; firstObserved = CFAbsoluteTimeGetCurrent(); }
            if (CFAbsoluteTimeGetCurrent() - firstObserved >= 3 && [value[@"epoch"] doubleValue] > firstEpoch + 30000 && [value[@"people"] intValue] > 0) {
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
        [NSApp setActivationPolicy:NSApplicationActivationPolicyAccessory];
        NSBundle *bundle = [NSBundle bundleWithPath:[[NSString stringWithUTF8String:argv[1]] stringByStandardizingPath]];
        Class principal = bundle.principalClass;
        if (!principal || ![principal isSubclassOfClass:ScreenSaverView.class]) { NSLog(@"FAIL loading saver bundle"); return 1; }
        NSRect frame = NSMakeRect(0,0,960,640);
        NSWindow *window = [[NSWindow alloc] initWithContentRect:frame styleMask:NSWindowStyleMaskBorderless backing:NSBackingStoreBuffered defer:NO];
        ScreenSaverView *saver = [[principal alloc] initWithFrame:frame isPreview:YES];
        window.contentView = saver;
        [window orderFrontRegardless];
        [saver startAnimation];
        WKWebView *web = [saver valueForKey:@"webView"];
        if (!web) return 1;
        poll(web);
        NSDate *deadline = [NSDate dateWithTimeIntervalSinceNow:120];
        while (!done && deadline.timeIntervalSinceNow > 0) {
            [NSRunLoop.currentRunLoop runUntilDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
        }
        [saver stopAnimation];
        if ([saver valueForKey:@"webView"] != nil) result = 1;
        [window orderOut:nil];
        if (!done) NSLog(@"FAIL WebKit startup/animation timed out");
        return result;
    }
}
