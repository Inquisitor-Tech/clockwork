namespace ClockworkApi.DTOs;

// ─── Auth ─────────────────────────────────────────────────────────────────────

public record SignUpRequest(string Email, string Password, decimal DefaultRate);
public record SignInRequest(string Email, string Password);
public record AuthResponse(string Token, UserDto User);

public record UserDto(int Id, string Email, decimal DefaultRate, DateTime CreatedAt);

// ─── Clients ──────────────────────────────────────────────────────────────────

public record CreateClientRequest(
    string FullName,
    string Email,
    string Phone,
    decimal HourlyRate,
    string Notes
);

public record UpdateClientRequest(
    string? FullName,
    string? Email,
    string? Phone,
    decimal? HourlyRate,
    string? Notes
);

public record ClientDto(
    int Id,
    int UserId,
    string FullName,
    string Email,
    string Phone,
    decimal HourlyRate,
    decimal TotalOwed,
    string Notes,
    DateTime CreatedAt
);

// ─── Consultations ────────────────────────────────────────────────────────────

public record CreateConsultationRequest(
    int ClientId,
    string ClientName,
    DateTime StartDatetime,
    DateTime EndDatetime,
    int DurationMinutes,
    decimal TotalCharge,
    string Notes
);

public record UpdateConsultationRequest(
    decimal? TotalCharge,
    string? Notes
);

public record ConsultationDto(
    int Id,
    int UserId,
    int ClientId,
    string ClientName,
    DateTime StartDatetime,
    DateTime EndDatetime,
    int DurationMinutes,
    decimal TotalCharge,
    string Notes,
    DateTime CreatedAt
);
