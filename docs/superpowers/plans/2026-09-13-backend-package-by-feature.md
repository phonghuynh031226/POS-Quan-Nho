# Backend Package by Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tạo bộ khung package theo feature cho Spring Boot backend của Quán Nhỏ.

**Architecture:** Mỗi nghiệp vụ sở hữu mã nguồn của chính nó dưới `com.quannho.pos`; không có package kỹ thuật dùng chung kiểu `controller`, `service`, `entity`, hoặc `repository`. Các thư mục được giữ trong source tree bằng `package-info.java` mô tả ranh giới của feature.

**Tech Stack:** Java 17, Spring Boot 4.1.1, Maven Wrapper

**Spec:** `docs/superpowers/specs/2026-09-13-backend-package-by-feature-design.md`

## Global Constraints

- Package gốc là `com.quannho.pos`.
- Không tạo package tổng `controller`, `service`, `entity`, hoặc `repository`.
- Chưa tạo class controller/service/entity/repository rỗng khi chưa triển khai hành vi.
- Mỗi package phải có `package-info.java` để tồn tại trong Git.

---

### Task 1: Scaffold feature packages

**Files:**
- Create: `Quan-Nho-Backend/src/main/java/com/quannho/pos/{auth,catalog,order,settings,report,display,shared}/package-info.java`
- Create: các package con và `dto/package-info.java` được liệt kê trong spec.

**Interfaces:**
- Consumes: package gốc `com.quannho.pos` và thiết kế feature đã duyệt.
- Produces: 22 package Java làm vị trí cho các class nghiệp vụ sau này.

- [x] **Step 1: Kiểm tra trạng thái ban đầu**

Run: `rg --files src/main/java/com/quannho/pos`

Expected: chỉ có `QuanNhoBackendApplication.java`, chưa có các package feature.

- [x] **Step 2: Tạo package scaffold**

Mỗi file dùng mẫu sau, thay mô tả và package declaration tương ứng:

```java
/**
 * Product catalog feature.
 */
package com.quannho.pos.catalog.product;
```

- [x] **Step 3: Kiểm tra package cấm không tồn tại**

Run: `$forbidden = 'controller','service','entity','repository'; $forbidden | ForEach-Object { Test-Path "src/main/java/com/quannho/pos/$_" }`

Expected: bốn dòng `False`.

- [ ] **Step 4: Chạy kiểm thử Maven**

Run: `.\mvnw.cmd test`

Expected: `BUILD SUCCESS` và không có test failure.

Actual: mã nguồn compile thành công, nhưng test `contextLoads` có sẵn thất bại vì
backend chưa cấu hình datasource PostgreSQL (`Failed to determine a suitable
driver class`). Việc cấu hình database nằm ngoài phạm vi scaffold package.

- [x] **Step 5: Kiểm tra danh sách package**

Run: `rg --files src/main/java/com/quannho/pos | Sort-Object`

Expected: application class và đủ 22 file `package-info.java` nêu trong spec.
