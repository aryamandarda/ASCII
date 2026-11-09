#import <ScreenSaver/ScreenSaver.h>
#import <WebKit/WebKit.h>

@interface ADTimesSquareSaverView : ScreenSaverView <WKNavigationDelegate>
@property(nonatomic, strong) WKWebView *webView;
@property(nonatomic, strong) NSURL *artworkRoot;
@property(nonatomic) BOOL framePending;
@property(nonatomic) NSUInteger presentedFrames;
@end

@implementation ADTimesSquareSaverView
- (instancetype)initWithFrame:(NSRect)frame isPreview:(BOOL)isPreview {
    self = [super initWithFrame:frame isPreview:isPreview];
    if (self) {
        self.animationTimeInterval = 1.0 / 60.0;
        self.wantsLayer = YES;
        self.layer.backgroundColor = NSColor.blackColor.CGColor;
        self.artworkRoot = [[NSBundle bundleForClass:self.class] URLForResource:@"Artwork" withExtension:nil];
        [self prepareWebView];
    }
    return self;
}
- (BOOL)hasConfigureSheet { return NO; }
- (void)prepareWebView {
    if (self.webView || !self.artworkRoot) return;
    WKWebViewConfiguration *configuration = [WKWebViewConfiguration new];
    configuration.websiteDataStore = WKWebsiteDataStore.nonPersistentDataStore;
    WKWebView *view = [[WKWebView alloc] initWithFrame:self.bounds configuration:configuration];
    view.autoresizingMask = NSViewWidthSizable | NSViewHeightSizable;
    view.navigationDelegate = self;
    view.alphaValue = 0;
    self.webView = view;
    [self addSubview:view];
    [view loadFileURL:[self.artworkRoot URLByAppendingPathComponent:@"index.html"] allowingReadAccessToURL:self.artworkRoot];
}
- (void)startAnimation {
    [super startAnimation];
    [self prepareWebView];
    [self.webView evaluateJavaScript:@"if(typeof last!=='undefined')last=0" completionHandler:nil];
}
- (void)stopAnimation {
    [super stopAnimation];
    // Keep the decoded artwork and canvas for an immediate subsequent start.
}
- (void)animateOneFrame {
    WKWebView *view = self.webView;
    if (!self.isAnimating || !view || view.loading || self.framePending) return;
    self.framePending = YES;
    NSString *script = [NSString stringWithFormat:@"window.ASCII_NATIVE_FRAME ? window.ASCII_NATIVE_FRAME(%.3f,0,0) : null", NSProcessInfo.processInfo.systemUptime * 1000];
    __weak ADTimesSquareSaverView *weakSelf = self;
    [view evaluateJavaScript:script completionHandler:^(id value, NSError *error) {
        ADTimesSquareSaverView *saver = weakSelf;
        if (!saver || saver.webView != view) return;
        saver.framePending = NO;
        if (error) { NSLog(@"Times Square render failed: %@", error); return; }
        if (![value isKindOfClass:NSDictionary.class] || ![value[@"ready"] boolValue]) return;
        saver.presentedFrames++;
        if (view.alphaValue == 0) {
            [NSAnimationContext runAnimationGroup:^(NSAnimationContext *context) {
                context.duration = .25;
                view.animator.alphaValue = 1;
            } completionHandler:nil];
        }
    }];
}
- (void)webView:(WKWebView *)webView didFailProvisionalNavigation:(WKNavigation *)navigation withError:(NSError *)error {
    NSLog(@"Times Square navigation failed: %@", error);
}
- (void)webView:(WKWebView *)webView didFailNavigation:(WKNavigation *)navigation withError:(NSError *)error {
    [self webView:webView didFailProvisionalNavigation:navigation withError:error];
}
- (void)webView:(WKWebView *)webView decidePolicyForNavigationAction:(WKNavigationAction *)action decisionHandler:(void (^)(WKNavigationActionPolicy))decisionHandler {
    NSURL *url = action.request.URL;
    NSString *root = [self.artworkRoot.URLByResolvingSymlinksInPath.path stringByAppendingString:@"/"];
    decisionHandler(url.isFileURL && [url.URLByResolvingSymlinksInPath.path hasPrefix:root] ? WKNavigationActionPolicyAllow : WKNavigationActionPolicyCancel);
}
- (void)webViewWebContentProcessDidTerminate:(WKWebView *)webView {
    if (webView != self.webView) return;
    webView.navigationDelegate = nil;
    [webView removeFromSuperview];
    self.webView = nil;
    self.framePending = NO;
    [self prepareWebView];
}
@end
