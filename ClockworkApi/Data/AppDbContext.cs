using Microsoft.EntityFrameworkCore;
using ClockworkApi.Models;

namespace ClockworkApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<Consultation> Consultations => Set<Consultation>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // User
        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(u => u.Id);
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Email).IsRequired().HasMaxLength(255);
            e.Property(u => u.PasswordHash).IsRequired();
            e.Property(u => u.DefaultRate).HasColumnType("decimal(10,2)");
        });

        // Client
        modelBuilder.Entity<Client>(e =>
        {
            e.HasKey(c => c.Id);
            e.Property(c => c.FullName).IsRequired().HasMaxLength(255);
            e.Property(c => c.Email).HasMaxLength(255);
            e.Property(c => c.Phone).HasMaxLength(50);
            e.Property(c => c.HourlyRate).HasColumnType("decimal(10,2)");
            e.Property(c => c.TotalOwed).HasColumnType("decimal(10,2)");
            e.Property(c => c.Notes).HasMaxLength(2000);

            e.HasOne(c => c.User)
             .WithMany(u => u.Clients)
             .HasForeignKey(c => c.UserId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // Consultation
        modelBuilder.Entity<Consultation>(e =>
        {
            e.HasKey(c => c.Id);
            e.Property(c => c.ClientName).IsRequired().HasMaxLength(255);
            e.Property(c => c.TotalCharge).HasColumnType("decimal(10,2)");
            e.Property(c => c.Notes).HasMaxLength(2000);

            e.HasOne(c => c.User)
             .WithMany(u => u.Consultations)
             .HasForeignKey(c => c.UserId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(c => c.Client)
             .WithMany(cl => cl.Consultations)
             .HasForeignKey(c => c.ClientId)
             .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
