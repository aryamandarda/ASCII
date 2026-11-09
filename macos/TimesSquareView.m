#import <ScreenSaver/ScreenSaver.h>
#import <WebKit/WebKit.h>

@interface ADTimesSquareSaverView : ScreenSaverView <WKNavigationDelegate>
@property(nonatomic, strong) WKWebView *webView;
@property(nonatomic, strong) NSImageView *frameView;
@property(nonatomic, strong) NSTextField *statusView;
@property(nonatomic, strong) NSURL *artworkRoot;
@property(nonatomic) BOOL framePending;
@property(nonatomic) NSUInteger presentedFrames;
@end

@implementation ADTimesSquareSaverView
- (instancetype)initWithFrame:(NSRect)frame isPreview:(BOOL)isPreview {
    self = [super initWithFrame:frame isPreview:isPreview];
    if (self) {
        self.animationTimeInterval = 1.0 / 24.0;
        self.wantsLayer = YES;
        self.layer.backgroundColor = NSColor.blackColor.CGColor;
        NSBundle *bundle = [NSBundle bundleForClass:self.class];
        self.artworkRoot = [bundle URLForResource:@"Artwork" withExtension:nil];
        self.frameView = [[NSImageView alloc] initWithFrame:self.bounds];
        self.frameView.autoresizingMask = NSViewWidthSizable | NSViewHeightSizable;
        self.frameView.imageScaling = NSImageScaleProportionallyUpOrDown;
        self.frameView.image = [[NSImage alloc] initWithContentsOfURL:[bundle URLForResource:@"thumbnail@2x" withExtension:@"png"]];
        [self addSubview:self.frameView];
        self.statusView = [NSTextField labelWithString:@"Loading Times Square…"];
        self.statusView.textColor = NSColor.whiteColor;
        self.statusView.alignment = NSTextAlignmentCenter;
        self.statusView.frame = NSMakeRect(10, 12, MAX(0, frame.size.width - 20), 40);
        self.statusView.autoresizingMask = NSViewWidthSizable | NSViewMaxYMargin;
        [self addSubview:self.statusView];
    }
    return self;
}
- (BOOL)hasConfigureSheet { return NO; }
- (void)startAnimation {
    [super startAnimation];
    if (self.webView) return;
    if (!self.artworkRoot) { self.statusView.stringValue = @"Times Square artwork is missing. Please reinstall."; return; }
    self.framePending = NO;
    self.presentedFrames = 0;
    self.statusView.hidden = NO;
    self.statusView.stringValue = @"Loading Times Square…";
    WKWebViewConfiguration *configuration = [WKWebViewConfiguration new];
    configuration.websiteDataStore = WKWebsiteDataStore.nonPersistentDataStore;
    WKWebView *view = [[WKWebView alloc] initWithFrame:self.bounds configuration:configuration];
    view.autoresizingMask = NSViewWidthSizable | NSViewHeightSizable;
    view.navigationDelegate = self;
    self.webView = view;
    // WebKit supplies pixels, not the visible layer. Tahoe's legacy screen saver
    // host can stop compositing a WKWebView even while JavaScript keeps running.
    [self addSubview:view positioned:NSWindowBelow relativeTo:self.frameView];
    NSURL *index = [self.artworkRoot URLByAppendingPathComponent:@"index.html"];
    [view loadFileURL:index allowingReadAccessToURL:self.artworkRoot];
}
- (void)stopAnimation {
    [super stopAnimation];
    WKWebView *view = self.webView;
    self.webView = nil;
    self.framePending = NO;
    view.navigationDelegate = nil;
    [view stopLoading];
    [view removeFromSuperview];
}
- (void)animateOneFrame {
    WKWebView *view = self.webView;
    if (!self.isAnimating || !view || view.loading || self.framePending) return;
    self.framePending = YES;
    double milliseconds = NSProcessInfo.processInfo.systemUptime * 1000;
    CGFloat scale = self.window.backingScaleFactor ?: 1;
    NSString *script = [NSString stringWithFormat:@"window.ASCII_NATIVE_FRAME ? window.ASCII_NATIVE_FRAME(%.3f,%.0f,%.0f) : null", milliseconds, self.bounds.size.width * scale, self.bounds.size.height * scale];
    __weak ADTimesSquareSaverView *weakSelf = self;
    [view evaluateJavaScript:script completionHandler:^(id value, NSError *error) {
        ADTimesSquareSaverView *saver = weakSelf;
        if (!saver || saver.webView != view) return;
        saver.framePending = NO;
        if (error) { NSLog(@"Times Square render failed: %@", error); saver.statusView.hidden = NO; saver.statusView.stringValue = @"Times Square couldn't render. See Console for details."; return; }
        if (![value isKindOfClass:NSDictionary.class]) return;
        NSString *failure = value[@"error"];
        if (failure.length) { NSLog(@"Times Square artwork failed: %@", failure); saver.statusView.hidden = NO; saver.statusView.stringValue = @"Times Square couldn't load its artwork. Please reinstall."; return; }
        NSString *dataURL = value[@"image"];
        if (![dataURL isKindOfClass:NSString.class]) return;
        NSRange comma = [dataURL rangeOfString:@","];
        if (comma.location == NSNotFound) return;
        NSData *bytes = [[NSData alloc] initWithBase64EncodedString:[dataURL substringFromIndex:comma.location + 1] options:0];
        NSImage *image = [[NSImage alloc] initWithData:bytes];
        if (image) { saver.frameView.image = image; saver.presentedFrames++; saver.statusView.hidden = YES; }
    }];
}
- (void)webView:(WKWebView *)webView didFailProvisionalNavigation:(WKNavigation *)navigation withError:(NSError *)error {
    NSLog(@"Times Square navigation failed: %@", error);
    self.statusView.hidden = NO;
    self.statusView.stringValue = @"Times Square couldn't open its artwork. Please reinstall.";
}
- (void)webView:(WKWebView *)webView didFailNavigation:(WKNavigation *)navigation withError:(NSError *)error {
    [self webView:webView didFailProvisionalNavigation:navigation withError:error];
}
- (void)webView:(WKWebView *)webView decidePolicyForNavigationAction:(WKNavigationAction *)action decisionHandler:(void (^)(WKNavigationActionPolicy))decisionHandler {
    NSURL *url = action.request.URL;
    NSString *root = [self.artworkRoot.URLByResolvingSymlinksInPath.path stringByAppendingString:@"/"];
    BOOL local = url.isFileURL && [url.URLByResolvingSymlinksInPath.path hasPrefix:root];
    decisionHandler(local ? WKNavigationActionPolicyAllow : WKNavigationActionPolicyCancel);
}
- (void)webViewWebContentProcessDidTerminate:(WKWebView *)webView {
    if (self.isAnimating && webView == self.webView) { [self stopAnimation]; [self startAnimation]; }
}
@end
