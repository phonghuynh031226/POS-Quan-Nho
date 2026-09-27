package com.quannho.pos.media;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ImageUploadControllerTest {
    private final ImageStorage storage = file ->
            new UploadedImage("https://res.cloudinary.com/demo/image/upload/quan-nho/products/test.jpg", "test");
    private final MockMvc mvc = MockMvcBuilders
            .standaloneSetup(new ImageUploadController(new ImageUploadService(storage)))
            .build();

    @Test void uploadsAnImageAndReturnsItsSecureUrl() throws Exception {
        var file = new MockMultipartFile("file", "coffee.jpg", MediaType.IMAGE_JPEG_VALUE, new byte[]{1, 2, 3});

        mvc.perform(multipart("/api/uploads/images").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").value("https://res.cloudinary.com/demo/image/upload/quan-nho/products/test.jpg"));
    }

    @Test void rejectsFilesThatAreNotImages() throws Exception {
        var file = new MockMultipartFile("file", "note.txt", MediaType.TEXT_PLAIN_VALUE, "not an image".getBytes());

        mvc.perform(multipart("/api/uploads/images").file(file))
                .andExpect(status().isUnsupportedMediaType());
    }

    @Test void rejectsImagesLargerThanTwoMegabytes() throws Exception {
        var file = new MockMultipartFile("file", "large.jpg", MediaType.IMAGE_JPEG_VALUE, new byte[2 * 1024 * 1024 + 1]);

        mvc.perform(multipart("/api/uploads/images").file(file))
                .andExpect(status().isPayloadTooLarge());
    }
}
