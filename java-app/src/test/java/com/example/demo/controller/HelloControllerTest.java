package com.example.demo.controller;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

public class HelloControllerTest {

  @Test
  public void testHello() {
    HelloController controller = new HelloController();
    String result = controller.hello();
    assertThat(result).isEqualTo("Hello from Java App!");
  }
}
