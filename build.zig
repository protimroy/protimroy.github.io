const std = @import("std");
const Goku = @import("goku").Goku;

pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    const site_path = b.path("");
    const out_path = b.path("build");
    const static_path = b.path("static");

    const goku_dep = b.dependency("goku", .{
        .target = target,
        .optimize = optimize,
    });

    const site_step = b.step("site", "Build the site with Goku");

    // Use the Goku build method
    const build_site = Goku.build(goku_dep, site_path, out_path);
    const copy_static = Goku.copyStatic(goku_dep, static_path, out_path);
    copy_static.step.dependOn(&build_site.step);

    site_step.dependOn(&copy_static.step);

    const serve_step = b.step("serve", "Serve the built Goku site");
    const serve_site = Goku.preview(goku_dep, site_path, out_path);
    serve_site.step.dependOn(&copy_static.step);
    serve_step.dependOn(&serve_site.step);
}