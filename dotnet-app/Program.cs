var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet("/hello", () => "Hello from .NET App!");

app.Run();

public partial class Program { } // for testing
